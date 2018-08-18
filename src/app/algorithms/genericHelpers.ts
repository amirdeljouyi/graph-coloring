'use strict';

const self = {
    deepCopy(deep: boolean, clone: any, copy: any) {
        const isPlainObject = (obj: any) => {
            if (!obj || {}.toString.call(obj) !== '[object Object]') {
                return false;
            }

            const proto = Object.getPrototypeOf(obj);

            if (!proto) {
                return true;
            }

            // Objects with prototype are plain iff they were constructed by a global Object function
            const Ctor = ({}).hasOwnProperty.call(proto, 'constructor') && proto.constructor;
            return typeof Ctor === 'function' && ({}).hasOwnProperty.toString.call(Ctor) === ({}).hasOwnProperty.toString.call(Object);
        };


        let options, name, src, copyIsArray,
            target = arguments[0] || {},
            i = 1,
            // tslint:disable-next-line:prefer-const
            length = arguments.length;

        // Handle a deep copy situation
        if (typeof target === 'boolean') {
            deep = target;

            // Skip the boolean and the target
            target = arguments[i] || {};
            i++;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== 'object' && typeof target !== 'function') {
            target = {};
        }

        if (i === length) {
            target = this;
            i--;
        }

        for (; i < length; i++) {

            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {

                // Extend the base object
                // tslint:disable-next-line:forin
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (isPlainObject(copy) ||
                        (copyIsArray = Array.isArray(copy)))) {

                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];

                        } else {
                            clone = src && isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = self.deepCopy(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    },

    deepFreeze: <T>(o: T): Readonly<T> => {
        Object.freeze(o);

        Object.getOwnPropertyNames(o).forEach((prop: string | number) => {
            if (o.hasOwnProperty(prop) && (o as any)[prop] !== null
                && (typeof (o as any)[prop] === 'object' || typeof (o as any)[prop] === 'function')
                && !Object.isFrozen((o as any)[prop])) {
                self.deepFreeze((o as any)[prop]);
            }
        });

        return o;
    },

    sort: <T>(arr: T[], compareFunction: (a: any, b: any) => number): T[] => {
        return [...arr].sort(compareFunction);
    },

    datasetToArray: (ds: any, key: string): Readonly<any[]> => {
        const r: any[] = [];
        ds.forEach((v: { [index: string]: any }) => {
            r.push(v[key]);
        });
        return self.deepFreeze(r);
    },

    keepOnlyKeys: <T>(arr: T[], keys: string[]): Readonly<T[]> => {
        arr = arr.slice();
        arr.forEach((v: any) => {
            const k = Object.keys(v);
            k.forEach((key) => {
                if (keys.indexOf(key) < 0) {
                    delete v[key];
                }
            });
        });
        return self.deepFreeze(arr);
    },

    htmlEncode: (string: string): string => {
        const t = document.createElement('textarea');
        t.textContent = string;
        string = t.innerHTML.replace(/(?:\r\n|\r|\n)/g, '<br/>');
        return string;
    },

    printout: (text: string, escape?: string): void => {
        if (escape) {
            text = this.htmlEncode(escape);
        }
        document.getElementById('printout').innerHTML = text;
    },

    flatten: <T>(map: { [key: string]: T }): Readonly<T[]> => {
        const r: T[] = [];
        Object.keys(map).forEach((i) => {
            r.push(map[i]);
        });
        return self.deepFreeze(r);
    },

    rotate: (map: any): Readonly<any> => {
        const r: any = {};
        Object.keys(map).forEach((i) => {
            if (map[i] in r) {
                r[map[i]].push(i);
            } else {
                r[map[i]] = [i];
            }
        });
        return self.deepFreeze(r);
    },

    max: (iterable: any[]): number => {
        return iterable.reduce((a, b) => {
            return Math.max(a, b);
        });
    },

    toTitleCase: (str: string): string => {
        return str.replace(/(?:^|\s)\w/g, (match) => {
            return match.toUpperCase();
        });
    },
};

export default self;
