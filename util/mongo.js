import _ from 'lodash';
import mongoose from 'mongoose';
import {
	sendResponse,
	InvalidResourceError,
	ValidationError
} from 'node-lambda-toolkit';

const mungeValidationErr = error => {
	return {
		errors: _.mapValues(error.errors, e => e.message),
		message: _.values(_.mapValues(error.errors, e => e.message))
	};
};

// run pre-save validation of model instance
const validate = instance => {
	const error = instance.validateSync();
	if (error) {
		return {
			isValid: false,
			errors: mungeValidationErr(error)
		};
	} else {
		return { isValid: true };
	}
};

const toObjectId = id => {
	return mongoose.Types.ObjectId(id);
};

const tryReportValidationErr = err => {
	if (err.errors) {
		return getMungedErrors(err);
	} else {
		return null;
	}
};

// get all indices in nested path to desired resource
// throw error if invalid id is part of path
const getIndices = (obj, path) => {
	const pathArr = path.split('.');
	let currResource = obj;
	const indices = {};
	pathArr.forEach(p => {
		const prop = p.split('/')[0];
		const id = p.split('/')[1];
		const idx = currResource[prop].findIndex(el => el._id && el._id.equals(id));
		if (idx === -1) {
			throw new InvalidResourceError(`${prop}[${id}] does not exist`);
		} else {
			currResource = currResource[prop][idx];
			indices[prop] = idx;
		}
	});
	return indices;
};

export {
	validate,
	toObjectId,
	mungeValidationErr,
	tryReportValidationErr,
	getIndices
};

const getMungedErrors = err => {
	const errObj = { errors: getErrors(err) };
	return mungeValidationErr(errObj);
};

const getErrors = err => {
	if ('errors' in err) {
		return Object.keys(err.errors).reduce((all, path) => {
			const newErrors = getErrors(err.errors[path]);
			return newErrors.length ? [...all, ...newErrors] : [...all, newErrors];
		}, []);
	} else {
		return { message: err.message };
	}
};
