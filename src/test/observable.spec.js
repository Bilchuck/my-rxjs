const { isFunction, equal, deepEqual } = require('chai').assert
const Observable = require("../");

describe("Observable", () => {
    let smallNumbersStream;
    let bigNumbersStream;
    beforeEach(() => {
        smallNumbersStream = Observable.create(({next}) => [1,2,3].forEach(i => next(i)));
        bigNumbersStream = Observable.create(({next}) => [10, 90, 30, 40, 50, 60, 70, 80,20].forEach(i => next(i)));
    })
    describe("create function", () => {
        it("should return Observable object", () => {
            const ob = Observable.create(() => null);
            isFunction(ob.subscribe);
        });
        it("should trigger onNext", () => {
            let res = 0;
            smallNumbersStream.subscribe(i => res += i);
            equal(res, 6);
        });
    });
    describe("map function", () => {
        it("should change observed data by function", () => {
            let res = 0;
            const newOb = Observable.map(i => i + 1, smallNumbersStream);
            newOb.subscribe(i => res += i);
            equal(res, 9);
        });
    });
    describe("map method", () => {
        it("should change observed data by function", () => {
            let res = 0;
            const newOb = smallNumbersStream.map(i => i + 1);
            newOb.subscribe(i => res += i);
            equal(res, 9);
        });
    });
    describe("filter method", () => {
        it("should filter observed data by function", () => {
            const res = [];
            const newOb = bigNumbersStream.filter(x => x <= 50);
            newOb.subscribe(x => res.push(x));
            deepEqual(res, [10, 30, 40, 50, 20]);
        });
    });
    describe("fromArray method", () => {
        it("should create observable from array", () => {
            const start = [1,2,3,4,"asdfdsf"];
            const end = [];
            const stream = Observable.fromArray(start).subscribe(x => end.push(x));
            deepEqual(start, end);
        });
    });
    describe("takeUntil method", (done) => {
        it("should continue stream until observable is triggered", (done) => {
            const res = [];
            const stream = Observable.interval(100).takeUntil(Observable.interval(1000));
            stream.subscribe(x => res.push(x));
            setTimeout(() => {
                deepEqual(res, [1,2,3,4,5,6,7,8,9]);
                stream.unsubscribe();
                done();
            }, 1200)
        });
    });
    describe("takeWhile method", () => {
        it("should continue stream until expression is true", () => {
            const res = [];
            const stream = bigNumbersStream
                            .takeWhile(x => x < 50)
                            .subscribe(x => res.push(x));
            deepEqual(res, [10]);
        });
    });
    describe("interval method", (done) => {
        it("should create stream that every x miliseconds return iterator number", (done) => {
            const res = [];
            const stream = Observable.interval(1000).takeWhile(x => x <= 3);
            stream.subscribe(x => res.push(x));
            setTimeout(() => {
                deepEqual(res, [1]);
                stream.unsubscribe();
                done();
            }, 1500);
        });
    });
    describe("flatMap method", (done) => {
        it("should replace current stream with another one", () => {
            const res = [];
            smallNumbersStream.flatMap(x => bigNumbersStream).takeWhile(x => x < 90).subscribe(x => res.push(x));
            deepEqual(res, [10]);
        });
    });
});
