const states = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
};

const isThenable = maybePromise => maybePromise && typeof maybePromise.then === 'function';

class LearningPromise {
    constructor(computation) {
        this._state = states.PENDING;

        this._value = undefined;
        this._reason = undefined;

        this._thenQueue = [];
        this._finallyQueue = [];

        if (typeof computation === 'function') {
            setTimeout(() => {
                try {
                    computation(
                        this._onFulfilled.bind(this),
                        this._onRejected.bind(this)
                    );
                } catch (ex) {
                    this._onRejected(ex);
                }
            });
        }
    }

    then(fulfilledFn, catchFn) {
        const controlledPromise = new LearningPromise();
        this._thenQueue.push([controlledPromise, fulfilledFn, catchFn]);

        if (this._state === states.FULFILLED) {
            this._propagateFulfilled();
        } else if (this._state === states.REJECTED) {
            this._propagateRejected();
        }

        return controlledPromise;
    }

    catch(catchFn) {
        return this.then(undefined, catchFn);
    }

    finally(sideEffectFn) {
        if (this._state !== states.PENDING) {
            sideEffectFn();

            return this._state === states.FULFILLED
                ? LearningPromise.resolve(this._value)
                : LearningPromise.reject(this._reason)
        }

        const controlledPromise = new LearningPromise()
        this._finallyQueue.push([controlledPromise, sideEffectFn]);

        return controlledPromise;
    }

    _propagateFulfilled() {
        this._thenQueue.forEach(([controlledPromise, fulfilledFn]) => {
            if (typeof fulfilledFn === 'function') {
                const valueOrPromise = fulfilledFn(this._value);

                if (isThenable(valueOrPromise)) {
                    valueOrPromise.then(
                        value => controlledPromise._onFulfilled(value),
                        reason => controlledPromise._onRejected(reason)
                    );
                } else {
                    controlledPromise._onFulfilled(valueOrPromise);
                }
            } else {
                return controlledPromise._onFulfilled(this._value);
            }
        });

        this._finallyQueue.forEach(([controlledPromise, sideEffectFn]) => {
            sideEffectFn();
            controlledPromise._onFulfilled(this._value);
        });

        this._thenQueue = [];
        this._finallyQueue = [];
    }

    _propagateRejected() {
        this._thenQueue.forEach(([controlledPromise, _, catchFn]) => {
            if (typeof catchFn === 'function') {
                const valueOrPromise = catchFn(this._reason);

                if (isThenable(valueOrPromise)) {
                    valueOrPromise.then(
                        value => controlledPromise._onFulfilled(value),
                        reason => controlledPromise._onRejected(reason)
                    );
                } else {
                    controlledPromise._onFulfilled(valueOrPromise);
                }
            } else {
                return controlledPromise._onRejected(this._reason);
            }
        });

        this._finallyQueue.forEach(([controlledPromise, sideEffectFn]) => {
            sideEffectFn();
            controlledPromise._onRejected(this._value);
        });

        this._thenQueue = [];
        this._finallyQueue = [];
    }


    _onFulfilled(value) {
        if (this._state === states.PENDING) {
            this._state = states.FULFILLED;
            this._value = value;
            this._propagateFulfilled();
        }
    }

    _onRejected(reason) {
        if (this._state === states.PENDING) {
            this._state = states.REJECTED;
            this._reason = reason;
            this._propagateRejected();
        }
    }

}

LearningPromise.resolve = value => new LearningPromise(resolve => resolve(value));
LearningPromise.reject = value => new LearningPromise((_, reject) => reject(value));


module.exports = LearningPromise;
