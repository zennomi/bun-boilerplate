import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | undefined;

function getRequiredEnvironmentVariable(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} must be set before connecting to MongoDB.`);
	}

	return value;
}

/**
 * Connects Mongoose once per process and returns its shared instance.
 *
 * Define models independently of this function; Mongoose queues their queries
 * until this connection is ready.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
	if (mongoose.connection.readyState === 1) return mongoose;
	if (mongoose.connection.readyState === 2 && connectionPromise) {
		return connectionPromise;
	}

	connectionPromise = mongoose
		.connect(getRequiredEnvironmentVariable("MONGODB_URI"), {
			dbName: getRequiredEnvironmentVariable("MONGODB_DB_NAME"),
		})
		.catch((error: unknown) => {
			connectionPromise = undefined;
			throw error;
		});

	return connectionPromise;
}

/** Verifies the configured database connection. */
export async function pingDatabase(): Promise<void> {
	const database = await connectDatabase();
	const connection = database.connection.db;

	if (!connection) throw new Error("Mongoose connected without a database.");

	await connection.command({ ping: 1 });
}

/** Closes the shared Mongoose connection, primarily for shutdown and tests. */
export async function closeDatabase(): Promise<void> {
	if (mongoose.connection.readyState === 0) return;

	await mongoose.disconnect();
	connectionPromise = undefined;
}
