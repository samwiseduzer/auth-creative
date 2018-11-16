import mongoose from 'mongoose';
import { DBConnectError } from 'node-lambda-toolkit';
import Models from '../models';

// use built-in promises
mongoose.Promise = global.Promise;

export default context => {
	context.callbackWaitsForEmptyEventLoop = false;

	return new Promise((resolve, reject) => {
		console.log('Connecting to DB: ', process.env.NODE_ENV);
		try {
			if (![1, 2].includes(mongoose.connection.readyState)) {
				console.log('connecting to db...');
				mongoose.connect(
					process.env.MONGO_DB_CONN_STR,
					{ autoIndex: !!process.env.ADDING_INDICES },
					err => {
						if (err) {
							console.log('Failed to connect:', err);
							reject(new MongoConnectError(err));
						}
					}
				);
			} else {
				console.log('reusing old db connection...');
				resolve('connected');
			}
		} catch (err) {
			console.log('Failed to connect:', err);
			reject(new MongoConnectError(err));
		}

		mongoose.connection.once('open', function() {
			// mongoose.set('debug', true);
			console.log('connected to DB');
			mongoose.connection.on('error', err => {
				console.log('Mongoose Error:');
				console.log(JSON.stringify(err));
			});
			mongoose.connection.on('disconnected', () => {
				console.log('-> lost connection');
			});
			mongoose.connection.on('index', err => {
				if (err) console.log('ERROR CREATING INDEXES:', err);
				else console.log('Successfully created indexes');
			});
			resolve('connected');
		});
	});
};
