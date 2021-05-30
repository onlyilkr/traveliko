<template>
<div>
  <b-row no-gutters>
       <b-col cols="12">
         <b-navbar toggleable="sm" type="dark" variant="secondary">
            <b-navbar-brand href="#">Traveliko</b-navbar-brand>
            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
            <b-collapse id="nav-collapse" is-nav>
              <b-navbar-nav>
                <b-nav-item @click="showAboutModal">About</b-nav-item>
                <b-nav-item @click="showInfoModal">Info</b-nav-item>
              </b-navbar-nav>
            </b-collapse>
         </b-navbar>
       </b-col>
     
    </b-row>
    <b-row>
      <b-col>
        <b-navbar type="light" variant="light">
          <b-col>
          <b-row align-h="between" class="full-available">
              <b-col cols="6"  :class="isUserInsideRoom ? 'col-sm-4' : 'col-sm-6' ">
              <b-nav-form @submit.stop.prevent="searchUserLocation">
                <b-form-input size="md" :state="addressValidation" class="mr-sm-2" placeholder="i.e: Turkey Istanbul Eminonu" v-model="inputModel.address" required></b-form-input>
                <b-button variant="outline-success" class="my-2 my-sm-0" type="submit">Transport Me!</b-button>
              </b-nav-form>
            </b-col>
            <b-col cols="6" sm="4" v-if="isUserInsideRoom" class="mx-auto text-center align-self-center" order="1" order-sm="0">
              <h5><b-badge variant="success">🏠 Room ID: {{streetViewModel.roomId}}</b-badge> 
              <b-badge class="ml-1" variant="secondary">🔴 Active User: {{streetViewModel.activeUser}}</b-badge></h5>
            </b-col>
            <b-col cols="6"  v-if="!isUserInsideRoom" >
              <b-nav-form @submit.prevent="joinRoom" class="float-sm-right">
                <b-form-input size="md" :state="roomIdValidation" class="mr-sm-2" placeholder="Room Id" v-model="inputModel.roomId" required></b-form-input>
                <b-button variant="outline-primary" class="my-2 my-sm-0" type="submit">Join to Room</b-button>
              </b-nav-form>
            </b-col>
            <b-col cols="6" sm="4" v-if="isUserInsideRoom" >
              <b-nav-form @submit.prevent="exitRoom" class="float-right">
                <b-button variant="outline-danger" class="my-2 my-sm-0" type="submit">Leave the Room</b-button>
              </b-nav-form>
            </b-col>
            </b-row>
          </b-col>
            
      </b-navbar>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" class="mt-1">
        <b-overlay class="position-relative" :show="config.overlay.show" rounded="sm" @shown="onShown" @hidden="onHidden" id="maps-overlay">
        <div id="street-view"></div>
          <template #overlay>
          <div class="text-center">
            <b-icon icon="stopwatch" font-scale="3" animation="cylon"></b-icon>
            <p id="cancel-label">Please wait...</p>
            </div>
          </template>
        </b-overlay>
      </b-col>
    </b-row>
   <Modal :modalShow="modal.isActive" :modalContent="modal.content" @update-modal-show="(val) => modal.isActive = val">
     <div v-show="modal.type=='About'">
       <a target="_blank" href="https://www.patreon.com/bePatron?u=8124403"><img height="55" src="../assets/patreon.png"><img></a>
      <ul>
        <li><b-link target="_blank" href="http://ilkerguldali.com">About me</b-link></li>
        <li><b-link target="_blank" href="https://github.com/onlyilkr/traveliko">Github</b-link></li>
      </ul>
     </div>
   </Modal>

   <b-modal id="modal-username" ref="modal-username" title="Submit Your Name" @ok="userNameHandleOk">
      <form ref="userNameForm" @submit.stop.prevent="userNameHandleSubmit">
        <b-form-group label="Name" label-for="userName-input" invalid-feedback="Name is required" :state="modal.userNameState">
          <b-form-input id="userName-input" v-model="inputModel.userName" :state="modal.userNameState" required></b-form-input>
        </b-form-group>
      </form>
   </b-modal>
  </div>
</template>

<script>
import db from "../db";
import { google }  from "googlemaps";
import { Loader } from "@googlemaps/js-api-loader";
import Modal from "@/components/Modal.vue"
import thumbnailImage from "@/assets/thumbnail.jpg"
import helper, {RoomType} from "../helper"

let panoramaInstance;
let markerInstance;
let mapInstance;
let infoWindowInstance;
let streetViewServiceInstance;

export default {
  metaInfo: {
      title: 'Time to travel with friends on street view!',
      meta: [
        {
        vmid: "description",
        name: "description",
        content: "Time to travel with friends together on street view! Traveliko - Travel with Friends!"},
        {
        vmid: "og:image",
        property: "og:image",
        content: process.env.VUE_APP_ROOT_API + thumbnailImage},
        {
        vmid: "twitter:card",
        property: "twitter:card",
        content: "summary_large_image"},
        {
        vmid: "twitter:image",
        property: "twitter:image",
        content: process.env.VUE_APP_ROOT_API + thumbnailImage},
      ],
  },
  components: {
    Modal
  },
  mixins:[helper],
  data() {
    return {
      modal:{
        content:null,
        isActive:false,
        type:null,
        userNameState: null
      },
      loader: null,
      panoramaView: null,
      inputModel: {
        address: "Ankara Kurtuluş Park",
        roomId: null,
        userName: null,
      },
      isDBUpdate: false,
      isUserInsideRoom: false,
      roomType: null,
      streetViewModel: {
        roomId: null,
        lastRequestUid: null,
        sender: null,
        timestamp: null,
        position: {
          lat: null,
          lng: null,
        },
        pov: {
          heading: 265,
          pitch: 0,
        },
        activeUser: 1,
        userList:[],
      },
      resultModel: {
        lat: null,
        lng: null,
      },
      data: {
        roomId: null,
        lastRequestUid: null,
        sender: null,
        timestamp: null,
        position: {
          lat: null,
          lng: null,
        },
        pov: {
          heading: null,
          pitch: null,
        },
        activeUser: null,
        userList:[]
      },
      config: {
        overlay:{
          show:false
        }
      },
    };
  },
  mounted() {
    this.loader = new Loader({
      apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "visualization"],
    });

    this.loader.load().then(() => {
      this.initializeMap();
    });
  },
  created() {
    window.goToStreetView = this.goToStreetView;
    var mainRef = this;
    window.onbeforeunload = function(){
        mainRef.checkRoomUserCount();
    };
  },
  watch: {
    isUserInsideRoom: function(val, oldVal){
    let roomListener;
    if(val == true &&  oldVal == false){
      //DB Room Info Change Trigger
      console.debug("DB Change Trigger - Enter");
      roomListener = db.database().ref("rooms/"+this.streetViewModel.roomId);
      
      roomListener.on("value", snapshot => {
        if(snapshot.val() !== null){
          console.debug("DB Change Trigger - Enter");
          var result = snapshot.val();
          if((this.streetViewModel.lastRequestUid != result.lastRequestUid) && !this.isDBUpdate){
            console.debug("DB Change Trigger - Result: " + JSON.stringify(result));
        
            this.streetViewModel = result;
            this.getPanorama().catch(this.callToast);
          }
        }
      });
      }else if(val == false &&  oldVal == true && roomListener != undefined){
        console.debug("DB Change Trigger ~ DB Listener Stopped");
        roomListener.off();
      }
    }
  },
  computed: {
    infoWindowType: function () {
      return this.isUserInsideRoom ? "Continue" : "Start";
    },
    getInfoWindow: function () {
      return (
        '<button class="start-button" onclick="goToStreetView()">' +
        this.infoWindowType +
        "</button>"
      );
    },
    addressValidation(){
      if(this.inputModel.address){
        return this.inputModel.address != "";
      }else return null;
      
    },
    roomIdValidation(){
      if(this.inputModel.roomId){
        return this.inputModel.roomId != "" && !isNaN(Number.parseInt(this.inputModel.roomId)) ;
      }else return null;
    }
  },
  methods: {
    checkUserNameFormValidity() {
        const valid = this.$refs.userNameForm.checkValidity()
        this.modal.userNameState = valid
        return valid
    },
    userNameHandleOk(bvModalEvt) {
        bvModalEvt.preventDefault()
        this.userNameHandleSubmit()
    },
    userNameHandleSubmit() {
        if (!this.checkUserNameFormValidity()) {
          return
        }
        localStorage.setItem("traveliko-username",this.inputModel.userName)
        this.streetViewModel.userList.push({
          userName: this.inputModel.userName,
          isMoveAllowed: true
        });

        this.$nextTick(() => {
          this.$bvModal.hide('modal-username')
        })

        switch(this.roomType){
          case RoomType.CREATE_ROOM : 
            this.goToStreetView();
            break;
          case RoomType.JOIN_ROOM :
            this.joinRoom();
            break;
        }
    },
    showAboutModal(){
      this.modal.content = 'Hello there! I am İlker Güldalı A.K.A. "İKO" \n\nThere are 2 important points in the creation of this project. The first is because we could not go outside "together" with our friends during the covid-19 pandemic. The other was that we were looking for a rental house for my friend in Istanbul, Turkey, but we could not walk around the streets "together". For these reasons, I made such a sweet project 🙂.\n\nI hope you enjoyed this "Traveliko" app. If you want to contribute to this open source project, you can access the necessary information on the Github page.\n\nTake care of yourself! Have fun.🎉\n\nLast words...\nYou can buy me a cup of coffee by pressing the button below to support the creation of different projects like this 😊'
      this.modal.type = 'About';
      this.modal.isActive = true;
    },
    showInfoModal(){
      this.modal.content = "You can contact me from the e-mail address below.\n guldaliilker[🐎]gmail.com \n\nExcept for Google Analytics anonymous data, no personal data of any user is stored in this project. During the street view, instant navigation location information is kept using the Google Firabase Realtime Database infrastructure. When the number of people in the room drops to zero, this location information is automatically deleted.\n\nThis site or its owner is not liable for any illegal activities that are done using the service in any way. Use at your own disgretion. Google is a registered trademark and is copyrighted. This site is in no way affiliated with Google officially. This site is in no way responsible for the accuracy of the help or information provided in the maps. By using the service, you agree to these terms of services. Also, we reserve the right to change the terms of services in the future without any prior notice, as well as refusing to provide the service to anyone we choose to."
      this.modal.type = "Info";
      this.modal.isActive = true;
    },
    roomIdModalCountDownChanged(dismissCountDown){
      this.config.modal.room.dismissCountDown = dismissCountDown;
    },
    showMapsOverlay(val){
      this.config.overlay.show = val;
    },
    onShown() {
        this.$refs.cancel.focus()
    },
    onHidden() {
        this.$refs.show.focus()
    },
    initializeMap() {
      this.authenticationInit();

      streetViewServiceInstance = new window.google.maps.StreetViewService();

      this.mapInstanceInit();
      this.markerInstanceInit();
      this.panoramaInstanceInit();
    },
    getPanorama(){
        return new Promise((resolve, reject) => {
        streetViewServiceInstance.getPanorama({
          location: { lat: this.streetViewModel.position.lat, lng: this.streetViewModel.position.lng },
          radius: 100,
          source: window.google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
          if (status === window.google.maps.StreetViewStatus.OK) {
            this.setStreetViewMode(true);
            markerInstance.setPosition(data.location.latLng);
            markerInstance.setTitle(data.location.description);

            panoramaInstance.setPov({
              heading: this.streetViewModel.pov.heading,
              pitch: this.streetViewModel.pov.pitch,
            });
            panoramaInstance.setPano(data.location.pano);

            resolve(true)
          } else reject(new Error('Street View data not found for this location. 🥺'))
          });
        });
        
    },
    increaseRoomUserCount() {
      var room = db.database().ref("rooms").child(this.streetViewModel.roomId);
      if (room != null) {
        room.once("value").then(snapshot => {
          this.isDBUpdate = true;
          this.streetViewModel.lastRequestUid = helper.createGuid();
          this.streetViewModel.activeUser = snapshot.val().activeUser + 1;
          this.streetViewModel.userList.push({
            userName: this.inputModel.userName,
            isMoveAllowed: true
          });
          room.update(
            {
            activeUser: this.streetViewModel.activeUser,
            lastRequestUid: this.streetViewModel.lastRequestUid,
            userList: this.streetViewModel.userList
            },
            (error) => {
            if (error) {
              console.error("increaseRoomUserCount ~ Room count update is not successful :(" + error.toString());
            } else {
              console.debug("increaseRoomUserCount ~ Room count update is successful :)");
            }
          }
        );

        this.isDBUpdate = false;
        });
      }
    },
    updateDataStreetViewData() {
      this.data.position.lat = this.streetViewModel.position.lat;
      this.data.position.lng = this.streetViewModel.position.lng;
      this.data.pov.heading = this.streetViewModel.pov.heading;
      this.data.pov.pitch = this.streetViewModel.pov.pitch;
      this.data.activeUser = this.streetViewModel.activeUser;
      this.data.roomId = this.streetViewModel.roomId;
      this.data.timestamp = this.streetViewModel.timestamp;
      this.data.lastRequestUid = this.streetViewModel.lastRequestUid;
      this.data.userList = this.streetViewModel.userList;
    },
    showUserNameModal(){
      this.$nextTick(() => {
      this.$bvModal.show('modal-username');
        if(localStorage.getItem("traveliko-username") != null){
        this.inputModel.userName = localStorage.getItem("traveliko-username");
        }
      })
    },
    goToStreetView: function () {
      this.showMapsOverlay(true);
      console.debug("goToStreetView ~ event triggered");

      if(!this.modal.userNameState){
        this.roomType = RoomType.CREATE_ROOM;
        this.showUserNameModal();
      }else{
        this.getPanorama()
        .then((data)=> {
          if (!this.isUserInsideRoom) {
          console.debug("goToStreetView ~ Continue with create room.");
          this.createRoom();
          } else {
            console.debug("goToStreetView ~ Continue without create room.");
          }
          infoWindowInstance.setContent(this.getInfoWindow);
        }).catch(this.callToast);
      }
      this.showMapsOverlay(false);
    },
    callToast(alert){
      if(typeof(alert) == "string"){
        this.makeToast(alert, "Error")
      }else{
        this.makeToast(alert.message, "Error")
        }
      console.error(alert);
    },
    updateStreetView() {
      var room = db.database().ref("rooms").child(this.streetViewModel.roomId);
      if (room != null) {
        this.streetViewModel.lastRequestUid = helper.createGuid();
        this.streetViewModel.timestamp = new Date().toLocaleString();
        this.updateDataStreetViewData();
        let lastDbRequestUid;
        room.once("value").then((snapshot) => {
          var result = snapshot.val();
          lastDbRequestUid = result.lastRequestUid;
          console.debug("updateStreetView ~ DB Query Result: ActiveUserCount: " + result.activeUser + " lastRequestUid: "+ lastDbRequestUid);
        
        if (this.data.lastRequestUid !=  lastDbRequestUid) {
            this.isDBUpdate = true;
            console.debug("updateStreetView ~ Data will update: "+ JSON.stringify(this.data));
            room.update(this.data,
            (error) => {
            if (error) {
              console.error("updateStreetView ~ Location update is not successful :(" + error.toString());
            } else {
              console.debug("updateStreetView ~ Location update is successful :)");
            }
          }
        );
        this.isDBUpdate = false;
        }else{
          console.debug("updateStreetView ~ Location is up-to-date ");
        }
        });
      }
    },
    setStreetViewMode(val) {
      panoramaInstance.setVisible(val);
    },
    panoramaInstanceInit(){
      panoramaInstance = mapInstance.getStreetView();

      panoramaInstance.addListener("pov_changed", () => {
        this.streetViewModel.pov.heading = panoramaInstance.getPov().heading;
        this.streetViewModel.pov.pitch = panoramaInstance.getPov().pitch;
      });

      panoramaInstance.addListener("visible_changed", () => {
        if(!panoramaInstance.getVisible()){
          markerInstance.setPosition(panoramaInstance.getPosition());
          mapInstance.setCenter(panoramaInstance.getPosition());
          mapInstance.setZoom(16);
        }
      });

      panoramaInstance.addListener("position_changed", () => {
        if(!this.isDBUpdate && panoramaInstance.getVisible()){
          var lat = helper.getShortPosition(panoramaInstance.getPosition().lat());
          var lng = helper.getShortPosition(panoramaInstance.getPosition().lng());
          
          if (this.streetViewModel.position.lat != lat && this.streetViewModel.position.lng != lng) {
            console.debug("streetViewLocationListener ~ Triggered");

            this.streetViewModel.position.lat = lat;
            this.streetViewModel.position.lng = lng;
            this.streetViewModel.pov.heading = panoramaInstance.getPov().heading;
            this.streetViewModel.pov.pitch = panoramaInstance.getPov().pitch;

            this.updateStreetView();
          }
        }});
    },
    markerInstanceInit(){
      infoWindowInstance = new window.google.maps.InfoWindow({
        content: this.getInfoWindow,
      });

      markerInstance = new window.google.maps.Marker({
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      markerInstance.addListener("click", (e) => {
        infoWindowInstance.open(markerInstance.get("map"), markerInstance);
      });
    },
    mapInstanceInit(){
      mapInstance = new window.google.maps.Map(
        document.getElementById("street-view"),
        {
          center: { lat: 40.80276, lng: 29.43068 },
          zoom: 3,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit.station",
              stylers: [{ visibility: "off" }],
            },
          ],
          disableDoubleClickZoom: true,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
        }
      );

      mapInstance.addListener("click", event => {
        var markerPositionLat = helper.getShortPosition(event.latLng.lat());
        var markerPositionLng = helper.getShortPosition(event.latLng.lng());
        this.streetViewModel.position.lat = markerPositionLat;
        this.streetViewModel.position.lng = markerPositionLng;
        infoWindowInstance.setContent(this.getInfoWindow);
        markerInstance.setPosition({lat: markerPositionLat, lng: markerPositionLng});
        infoWindowInstance.open(markerInstance.get("map"), markerInstance);
      });
    },
    joinRoom() {
      var room = db.database().ref("rooms/" + this.inputModel.roomId);
      room.once("value", snapshot => {
        var roomValue = snapshot.val();
        if(roomValue !== null){
          if(!this.modal.userNameState){
            this.roomType = RoomType.JOIN_ROOM;
            this.showUserNameModal()
            return;
          }
          this.streetViewModel = roomValue;
          console.debug("joinRoom ~ Signed room info: " + JSON.stringify(this.streetViewModel));

          this.getPanorama()
          .then((data)=> {
            this.setStreetViewMode(true);
            this.isUserInsideRoom = true;
            this.increaseRoomUserCount();
            this.updateDataStreetViewData();

            infoWindowInstance.setContent(this.getInfoWindow);
          }).catch(this.callToast);
        }else{
          this.callToast("No room found with room number " + this.inputModel.roomId + "☹️");
        }
      });
    },
    searchUserLocation() {
      let geocoder;
      if(this.inputModel.address == null || this.inputModel.address.trim() == ""){
        return this.callToast("Please enter a valid address 🤠");
      }
     geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { address: this.inputModel.address },
          (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK) {
              mapInstance.setCenter(results[0].geometry.location);
              markerInstance.setPosition(results[0].geometry.location);
              infoWindowInstance.open(markerInstance.get("map"), markerInstance);
              mapInstance.setZoom(15);

              this.streetViewModel.position.lat = results[0].geometry.location.lat();
              this.streetViewModel.position.lng = results[0].geometry.location.lng();
            } else {
              this.callToast("Please enter a valid address 🤠");
            }
          }
        );
    },
    authenticationInit() {
      db.auth()
        .signInAnonymously()
        .catch(
          function (error) {
            console.log(error.code + ", " + error.message);
          },
          { remember: "sessionOnly" }
        );

      db.auth().onAuthStateChanged((user) => {
        if (user) {
          this.data.sender = user.uid;
        } else {
          console.debug("User is signed out.");
        }
      });
    },
    createRoom() {
      var roomId = this.generateRandomRoomId();
      this.streetViewModel.roomId = roomId;
      this.streetViewModel.timestamp = new Date().toLocaleString();
      this.streetViewModel.lastRequestUid = helper.createGuid();
      this.updateDataStreetViewData();

      var room = db.database().ref("rooms/" + roomId);
      room.transaction((currentData)=>{
        this.isDBUpdate = true;
        if(currentData === null){
          return this.data;
        }else{
          return this.createRoom();
        }
      }, (error, committed, snapshot) => {
        if(error){
          console.error("createRoom ~ Room didn't created. :(", error);
        }else if(!committed){
          console.debug("createRoom ~ Room already created with "+ roomId +" Id");
        }else{
          console.debug("createRoom ~ Room created with "+ roomId +" Id :)");
        }
        console.debug("createRoom ~ Created room data: "+ JSON.stringify(snapshot.val()));
        this.isUserInsideRoom = true;
        this.isDBUpdate = false;
      });
    },
    resetState(){
      this.streetViewModel.roomId= null;
      this.streetViewModel.lastRequestUid= null;
      this.streetViewModel.sender= null;
      this.streetViewModel.timestamp= null;
      this.streetViewModel.position.lat= markerInstance.getPosition().lat();
      this.streetViewModel.position.lng= markerInstance.getPosition().lng();
      this.streetViewModel.pov.heading= 265;
      this.streetViewModel.pov.pitch= 0;
      this.streetViewModel.activeUser= 1;
      this.streetViewModel.userList= [];
      this.resultModel.lat= null;
      this.resultModel.lng= null;
      this.data.roomId= null;
      this.data.lastRequestUid= null;
      this.data.sender= null;
      this.data.timestamp= null;
      this.data.position.lat= null;
      this.data.position.lng= null;
      this.data.pov.heading= null;
      this.data.pov.pitch= null;
      this.data.activeUser= null;
      this.data.userList= [];
      this.isUserInsideRoom = false;
      this.modal.userNameState = null;
      this.setStreetViewMode(false);
    },
    exitRoom(){
      this.checkRoomUserCount();
      this.isUserInsideRoom = false;
    },
    checkRoomUserCount() {
      if (this.isUserInsideRoom) {
        console.debug("Active User Count in Room: " + this.streetViewModel.activeUser);
        var roomRef = db
          .database()
          .ref("rooms").child(this.data.roomId);

        roomRef.get().then((snapshot) => {
          var data = snapshot.val();
          if (data.activeUser > 1) {
            roomRef.update({
              activeUser : data.activeUser - 1,
              lastRequestUid : helper.createGuid(),
              userList : data.userList.filter(item => item.userName != this.inputModel.userName)
            },(error) => {
            if (error) {
              console.error("checkRoomUserCount ~ Active User Count Didn't Reduced. Error" + error.toString());
            } else {
              console.debug("checkRoomUserCount ~ Active User Count Reduced to " + data.activeUser--);
              this.resetState();
            }});
          }else{
            roomRef.remove().then(() => {
              console.debug("checkRoomUserCount ~ Room Remove succeeded.");
              this.resetState();
            })
            .catch(function(error) {
              console.debug("checkRoomUserCount ~ Room Remove failed: " + error.message);
            });
          }
        });
      }
    },
    generateRandomRoomId: function () {
      return Math.floor(Math.random() * Math.floor(100000));
    },
    makeToast(message, title) {
        this.$bvToast.toast(message, {
          title: title,
          autoHideDelay: 4000,
          variant: "danger",
          solid: true
        })
      }
  },
};
</script>

<style lang="scss">
  #street-view {
    @media (max-width: 576px) { 
      width: 100%;
      height: calc(100vh - 235px);
    }

    @media (min-width:577px) and (max-width: 1164px) { 
      width: 100%;
      height: calc(100vh - 155px);
    }

    @media (min-width:1164px) { 
      width: 100%;
      height: calc(100vh - 135px);
    }
  }

.full-available{
  width: -webkit-fill-available;
}

.start-button{
  background-color: #4CAF50; 
  border: 1px solid #4CAF50;
  color: white;
  padding: 10px 22px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 15px;
  transition-duration: 0.6s;

  &:hover{
    background-color: #fff; /* Green */
    color: #4CAF50;
  }
}
</style>