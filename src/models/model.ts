import { model, models, type Model, type Schema } from "mongoose";

// Calling Mongoose's heavily overloaded `model()` through a small boundary
// avoids excessive type instantiation in this reusable generic helper.
type ModelCompiler = (name: string, schema: unknown) => unknown;

const compileModel = model as unknown as ModelCompiler;

/**
 * Registers a model once and returns the cached model on module reload.
 *
 * Define a schema in each model module, then pass it to this helper. Reusing
 * this factory avoids Mongoose's OverwriteModelError and gives every model the
 * same registration pattern.
 */
export function defineModel<T>(name: string, schema: Schema): Model<T> {
	const existingModel: unknown = models[name];

	if (existingModel) return existingModel as Model<T>;

	return compileModel(name, schema) as Model<T>;
}
