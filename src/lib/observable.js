const {
    curry,
    __,
    forEach,
    compose
} = require("bilchuck-ramda");

const create = observer => {
    let subscribed = false;
    const observable = {
        subscribe: (onNext, onError, onComplete) => {
            subscribed = true;
            observer({
                next: data => subscribed ? onNext(data) : null,
                error: errorData => onError(errorData),
                complete: data => onComplete && subscribed ? onComplete(complete) : null,
            });
        },
        unsubscribe: () => subscribed = false,
    };
    observable.map = map(__, observable);
    observable.filter = filter(__, observable);
    observable.takeUntil = takeUntil(__, observable);
    observable.takeWhile = takeWhile(__, observable);
    observable.flatMap = flatMap(__, observable);
    return observable;
};

const map = curry((fn, observable) =>
    create(({
            next,
            error,
            complete
        }) =>
        observable.subscribe(x => next(fn(x)), errorData => error(errorData), () => complete())
    )
);

const filter = curry((fn, observable) =>
    create(({
            next,
            error,
            complete
        }) =>
        observable.subscribe(x => fn(x) ? next(x) : null, errorData => error(errorData), () => complete())
    )
);

const fromArray = array => create(({
    next,
    complete,
    error
}) => compose(complete, forEach(next))(array));
const fromPromise = promise => create(
    ({
        next,
        complete,
        error
    }) =>
    promise.then(x => compose(complete, next)(x)).catch(error)
);

const takeUntil = curry((fn, observable) =>
    create(({
        next,
        error,
        complete
    }) => {
        let stopped = false;
        observable.subscribe(
            x => {
                if (fn(x)) {
                    complete();
                    observable.unsubscribe();
                } else {
                    next(x);
                }
            },
            errorData => error(errorData),
            () => complete(),
        );
    })
);
const takeWhile = curry((fn, observable) =>
    create(({
        next,
        error,
        complete
    }) => {
        let stopped = false;
        observable.subscribe(
            x => {
                if (fn(x)) {
                    next(x);
                } else {
                    complete();
                    observable.unsubscribe();
                }
            },
            errorData => error(errorData),
            () => complete(),
        );
    })
);

const interval = mseconds => {
    let interval;
    let iterator = 0;
    const observable = create(({next}) => {
        interval = setInterval(() => {
            iterator = iterator + 1;
            next(iterator);
        });
    });
    observable.unsubscribe = () => clearInterval(interval);
    return observable;
};

const flatMap = curry((fn, observable) =>
    create(({next, error, complete}) => {
        const stream = 
        observable.subscribe(
            x => fn(x).subscribe(next),
            errorData => error(errorData),
            () => complete(),
        );
    })
);

module.exports = {
    create,
    map,
    fromArray,
    filter,
    interval,
};