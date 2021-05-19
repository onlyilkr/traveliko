import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import thumbnailImage from '@/assets/thumbnail.jpg'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta:{
      title: 'Travel with Friends!',
      metaTags: [
        {
          name: 'description',
          content: 'Traveliko - Travel with Friends. Travel the streets with your friends in street view!'
        },
        {
          property: 'og:description',
          content: 'Traveliko - Travel with Friends. Travel the streets with your friends in street view!'
        }
      ]
    },
    beforeEnter: (to, from, next) => {
        to.meta.title = "Traveliko - Travel with Friends! | Time to travel with friends together on Street View";
        document.title = to.meta.title;

        var description = document.createElement('meta');
        description.name = "description";
        description.content = "Traveliko - Travel with Friends. Travel the streets with your friends in street view!";
        document.getElementsByTagName('head')[0].appendChild(description);

        var image = document.createElement('meta');
        image.setAttribute("property", "og:image");
        image.setAttribute("content", process.env.VUE_APP_ROOT_API + thumbnailImage);
        document.getElementsByTagName('head')[0].appendChild(image);

        var twitter = document.createElement('meta');
        twitter.setAttribute("property", "twitter:card");
        twitter.setAttribute("content", "summary_large_image");
        document.getElementsByTagName('head')[0].appendChild(twitter);

        var twitterImage = document.createElement('meta');
        twitterImage.setAttribute("property", "twitter:image");
        twitterImage.setAttribute("content", process.env.VUE_APP_ROOT_API + thumbnailImage);
        document.getElementsByTagName('head')[0].appendChild(twitterImage);
        next();
    }
  },
]

const router = new VueRouter({
  mode:'history',
  routes
})

export default router
