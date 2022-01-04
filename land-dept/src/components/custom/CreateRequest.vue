<template>
  <v-dialog v-model="dialog" width="500">
    <v-btn slot="activator" color="red lighten-2" dark>Create Sell Request</v-btn>
    <v-card>
      <v-form class="formOuter">
        <v-container py-0>
          <v-layout wrap>
            <br>
            <v-flex xs12 md6 mt-3>
              <v-text-field v-model="landId" class="purple-input" label="Land ID"/>
            </v-flex>
            <v-flex xs12 md6 mt-3>
              <v-text-field v-model="owner" label="Owner" class="purple-input"/>
            </v-flex>
            <v-flex xs12 md6 mt-1>
              <v-text-field v-model="owner" label="Owner" class="purple-input"/>
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
      landId: "",
      owner: "",
      error: "",
      dialog: false
    };
  },
  methods: {
    async addLand() {
      try {
        var res = await axios.post("/api/org.pingala.landregistry.Land", {
          $class: "org.pingala.landregistry.Land",
          landId: this.landId,
          owner: this.owner,
          coordinates: JSON.stringify(this.coordinates)
        });
        this.dialog = false;
      } catch (error) {
        this.error = error;
      }
    }
  }
};
</script>

<style>
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
  height: 300px;
}
</style>
