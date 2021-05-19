import Vue from "vue";
import store from "./store";
import router from "./router";
import App from "./App.vue";
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import VueMeta from 'vue-meta'

if (process.env.NODE_ENV === "production") {
  console.debug = function () {};
}

Vue.config.productionTip = false

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(VueMeta);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");