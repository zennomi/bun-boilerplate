export {
	closeDatabase,
	connectDatabase,
	pingDatabase,
} from "./database/mongoose";
export {
	createUser,
	ensureUserIndexes,
	findUserByEmail,
	USER_MODEL_NAME,
	UserModel,
	UserSchema,
	USERS_COLLECTION,
} from "./models/user.model";
export type {
	CreateUserInput,
	User,
	UserDocument,
} from "./models/user.model";

console.log("Hello via Bun !");
