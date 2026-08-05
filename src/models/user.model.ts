import { Schema, type HydratedDocument, type InferSchemaType } from "mongoose";

import { defineModel } from "./model";

export const USERS_COLLECTION = "users";
export const USER_MODEL_NAME = "User";

export const UserSchema = new Schema(
	{
		email: {
			type: String,
			required: [true, "A user email is required."],
			trim: true,
			lowercase: true,
		},
		name: {
			type: String,
			required: [true, "A user name is required."],
			trim: true,
		},
	},
	{
		collection: USERS_COLLECTION,
		timestamps: true,
	},
);

UserSchema.index({ email: 1 }, { name: "users_email_unique", unique: true });

export type User = InferSchemaType<typeof UserSchema> & {
	createdAt: Date;
	updatedAt: Date;
};

export interface CreateUserInput {
	email: string;
	name: string;
}

export type UserDocument = HydratedDocument<User>;

/** Mongoose model for the users collection. */
export const UserModel = defineModel<User>(USER_MODEL_NAME, UserSchema);

/** Creates and persists a user, applying schema normalization and validation. */
export async function createUser(
	input: CreateUserInput,
): Promise<UserDocument> {
	return UserModel.create(input);
}

/** Finds a user by its normalized email address. */
export async function findUserByEmail(
	email: string,
): Promise<UserDocument | null> {
	return UserModel.findOne({ email: email.trim().toLowerCase() });
}

/** Ensures this model's declared indexes are ready. */
export async function ensureUserIndexes(): Promise<void> {
	await UserModel.init();
}
