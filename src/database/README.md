# Mongoose

`mongoose.ts` owns the process-wide Mongoose connection. Set `MONGODB_URI` and
`MONGODB_DB_NAME`, then call `connectDatabase()` once during application startup.

Models can be imported before connecting: Mongoose queues their operations until
the shared connection is ready. Call `closeDatabase()` during graceful shutdown.
Do not create a connection per request.
