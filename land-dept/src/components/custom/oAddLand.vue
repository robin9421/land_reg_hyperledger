<template>
  <v-dialog v-model="dialog" width="500">
    <v-btn @click="popupOpened()" slot="activator" color="red lighten-2" dark>Add Land</v-btn>
    <v-card>
      <v-form class="formOuter">
        <v-container py-0>
          <v-layout wrap>
            <v-flex md12>
              <h4>Coordinates</h4>
            </v-flex>
            <br>
            <v-flex md12 style="margin-top: -10px;">
              <div id="selectMap"></div>
            </v-flex>
            <v-flex md6 mt-2>
              <v-select v-model="owner" :items="usernameList" label="Select Owner" outline></v-select>
            </v-flex>
            <v-flex md6 mt-2>
              <v-text-field v-model="landId" disabled label="Auto Generated LandId" outline></v-text-field>
            </v-flex>
            <v-flex md6 class="document">
              <v-text-field
                label="Upload Documents"
                @click="pickFile"
                v-model="fileName"
                prepend-icon="mdi-attachment"
              ></v-text-field>
              <input type="file" style="display: none" ref="image" @change="onFilePicked">
            </v-flex>
            <v-flex v-if="error">
              <p class="red--text">{{error}}</p>
            </v-flex>
          </v-layout>
        </v-container>
      </v-form>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="success" @click="addLand">Submit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from "../../axios";
import GoogleMaps from "load-google-maps-api";

export default {
  data() {
    return {
      coordinates: [],
      usernameList: [],
      landId: "",
      owner: "",
      error: "",
      dialog: false,
      fileName: "",
      file: ""
    };
  },
  methods: {
    pickFile() {
      this.$refs.image.click();
    },
    onFilePicked(e) {
      const files = e.target.files;
      this.fileName = files[0].name;
      const fr = new FileReader();
      fr.readAsDataURL(files[0]);
      fr.addEventListener("load", () => {
        this.file = files[0];
      });
    },
    async addLand() {
      try {
        let formData = new FormData();
        formData.append("path", this.file);
        var ipfsResponse = await axios.post(
          "http://127.0.0.1:5001/api/v0/add",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );
        var documents = [];
        documents.push(ipfsResponse.data);

        var res = await axios.post("/api/org.pingala.landregistry.Land", {
          $class: "org.pingala.landregistry.Land",
          landId: this.landId,
          owner: this.owner,
          coordinates: JSON.stringify(this.coordinates),
          documents: JSON.stringify(documents)
        });
        this.dialog = false;
        this.$emit("landAdded", res.data);
      } catch (error) {
        console.log('error: ', error);
        this.error = error;
      }
    },
    async popupOpened() {
      var landId = Math.random()
        .toString(36)
        .substring(2)
        .toUpperCase();
      this.landId = landId;
      this.coordinates = [];
      var googleMaps = await GoogleMaps({
        key: "AIzaSyA_1e6pjVHRZ9T6TCK7CoRadC-96F9Vy7I"
      });
      var map = new googleMaps.Map(document.getElementById("selectMap"), {
        zoom: 17,
        center: { lat: 12.969018, lng: 77.636369 },
        styles: [
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      googleMaps.event.addListener(map, "click", event => {
        var location = event.latLng;
        this.coordinates.push({ lat: location.lat(), lng: location.lng() });
        console.log("this.coordinates: ", this.coordinates);
        var marker = new googleMaps.Marker({
          position: location,
          map: map,
          draggable: true
        });
      });

      var users = await axios.get("/api/org.pingala.landregistry.User");
      users.data.forEach(user => {
        this.usernameList.push(user.username);
      });
    }
  }
};
</script>

<style scoped>
.v-text-field {
  margin-top: 0 !important;
  padding-top: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
.formOuter {
  padding: 10px;
}
.box {
  padding-top: 20px !important;
  border: 2px solid lightslategray;
  margin: 5px;
}
#selectMap {
  border: 3px solid lightslategray;
  overflow: scroll;
  width: 100%;
  height: 250px;
}
.document {
  margin-top: -15px;
  margin-bottom: -25px;
}
</style>
