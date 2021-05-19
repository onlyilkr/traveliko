<template>
  <b-modal
    v-model="isModalActive"
    class="modal"
    hide-footer
    centered
  >
    {{ modalContent }} <slot class="slot-content" />
  </b-modal>
</template>

<script>
export default {
name: "Modal",
props:["modalContent","modalShow"],
  data() {
        return {
          isModalActive: this.modalShow
        }
  },
  watch:{
    isModalActive: function(val) { 
      if(val){
        this.$emit("update-modal-show", true);
      }else{
        this.$emit("update-modal-show", false);
      }
    },
    modalShow: function(val){
      this.isModalActive = this.modalShow;
    }
  }
}
</script>

<style>
.modal{
  white-space: break-spaces;
}

.slot-content p a{
  text-decoration: none;
}
</style>