class Tab {

    constructor(app) {

        this.app = app;
        this.ui = this.app.ui;
        this.api = this.app.api;
        this.callbacks = this.app.callbacks;
    }

    async init() {

    }

    bind(element, event, callback) {

        const boundCallback = callback.bind(this);
        this.callbacks.push({
            element: element,
            event: event,
            callback: boundCallback
        });
        element.addEventListener(event, boundCallback);
    }

    unbind(element, event) {

        for (callback of this.callbacks) {

            if (callback.element === element && callback.event === event) {

                callback.element.removeEventListener(callback.event, callback.callback);
                this.callbacks.splice(this.callbacks.indexOf(callback), 1);
                break;
            }
        }
    }

    unbindAll() {

        for (callback of this.callbacks) {
            callback.element.removeEventListener(callback.event, callback.callback);
        }

        this.callbacks = [];
    }

    logError(error) {

        this.app.logError(error);
    }
}

export default Tab;