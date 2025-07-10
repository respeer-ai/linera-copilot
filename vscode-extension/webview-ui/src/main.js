"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vue_1 = require("vue");
const App_vue_1 = require("./App.vue");
const quasar_1 = require("quasar");
const pinia_1 = require("pinia");
require("@quasar/extras/material-icons/material-icons.css");
require("quasar/src/css/index.sass");
const app = (0, vue_1.createApp)(App_vue_1.default);
const pinia = (0, pinia_1.createPinia)();
app.use(pinia);
app.use(quasar_1.Quasar, {
    plugins: {},
});
app.mount('#app');
//# sourceMappingURL=main.js.map