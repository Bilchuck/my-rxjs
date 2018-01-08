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

const fromArray = array => create(({next, complete, error}) => compose(complete, forEach(next))(array));

const interval = mseconds => {
    let interval;
    let iterator = 0;
    const observable = create(({next}) => {
        interval = setInterval(() => {
            iterator = iterator + 1;
            next(iterator);
        }, mseconds);
    });
    observable.unsubscribe = () => clearInterval(interval);
    return observable;
};

const fromEvent = curry((event, subject) => {
    const fn = x => next(x);
    const observable = create(({next}) => 
        subject.addEventListener(event, fn)
    );
    observable.unsubscribe = () => subject.removeEventListener(event, fn);
    return observable;
});

// operators
const map = curry((fn, observable) =>
    create(({next, error, complete}) =>
        observable.subscribe(x => next(fn(x)), errorData => error(errorData), () => complete())
    )
);

const filter = curry((fn, observable) =>
    create(({next, error, complete}) =>
        observable.subscribe(x => fn(x) ? next(x) : null, errorData => error(errorData), () => complete())
    )
);

const takeUntil = curry((observable1, observable2) =>
    create(({next, error, complete}) => {
        const finish = () => {
            observable1.unsubscribe();
            observable2.unsubscribe();
            complete();
        }
        const _1 = observable1.subscribe(
            () => {
                finish();
            },
            errorData => error(errorData),
            finish,
        );
        const _2 = observable2.subscribe(
            x => {
                next(x)
            },
            errorData => error(errorData),
            () => complete(),
        );
    })
);

const takeWhile = curry((fn, observable) =>
    create(({next, error, complete}) => {
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
    fromEvent,
};