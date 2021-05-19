<template>
  <div id="#app">
    <b-container
      fluid
      class="container-up px-0"
    >
      <router-view />
    </b-container>
  </div>
</template>

<script>
export default {
  name: "App",
  metaInfo: {
      title: "Traveliko - Travel with Friends!",
      titleTemplate: "%s | Traveliko - Travel with Friends!"
    }
}
</script>

<style>
#app{
  overflow-x: hidden;
}

.container-up{
  overflow-x: hidden;
}
</style>