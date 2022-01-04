<template>
  <v-layout column>
    <v-flex>
      <v-layout row wrap>
        <v-flex xs12 md3 offset-md1>
          <material-card class="v-card-profile">
            <v-card-text class="text-xs-center">
              <h6 class="category text-gray font-weight-thin">Land Id</h6>
              <h3 style="margin-top:2px;">{{land.landId}}</h3>
              <div v-if="land.documents" class="documentField" @click="downloadDoc">
                <strong>
                  <h6 class="category text-gray font-weight-thin">Document</h6>
                </strong>
                <h5 style="margin-top:2px;">
                  {{land.documents[0].Name}}
                  <v-icon class="downloadBtn">mdi-arrow-down-bold-box</v-icon>
                </h5>
              </div>
              <v-divider></v-divider>
              <h4 class="card-title font-weight-light mt-3">{{owner.firstName}} {{owner.lastName}}</h4>
              <h6 class="category text-gray font-weight-thin mb-3">{{owner.username}}</h6>
              <h6 class="category text-gray font-weight-thin mb-3">{{owner.email}}</h6>
              <v-btn color="success" round class="font-weight-light">View Profile</v-btn>
            </v-card-text>
          </material-card>
        </v-flex>

        <v-flex offset-md1 md5>
          <div class="mapouter">
            <l-map :zoom="zoom" :center="center">
              <l-tile-layer :url="url" :attribution="attribution"/>
              <l-polygon :latLngs="coordinates"></l-polygon>
            </l-map>
          </div>
        </v-flex>
      </v-layout>
    </v-flex>
    <v-flex style="margin-top:75px;">
      <h3 class="ml-4">Ownership History</h3>
    </v-flex>
    <v-flex mt-10>
      <v-container>
        <v-layout class="historyList">
          <v-flex
            ml-5
            my-5
            xs12
            md3
            v-for="(history, index) in historyRecords"
            :key="history.transactionId"
          >
            <v-layout>
              <v-flex>
                <material-card class="v-card-profile">
                  <v-card-text class="text-xs-center">
                    <h6 class="category text-gray font-weight-thin">Land Id</h6>
                    <h3 style="margin-top:2px;">{{history.landId}}</h3>
                    <v-divider></v-divider>
                    <h4
                      class="card-title font-weight-light mt-3"
                    >{{history.firstName}} {{history.lastName}}</h4>
                    <h6 class="category text-gray font-weight-thin mb-3">{{history.username}}</h6>
                    <h6 class="category text-gray font-weight-thin mb-3">{{history.email}}</h6>
                    <h6 class="category text-gray font-weight-thin mb-3">{{history.timeStamp}}</h6>
                    <v-btn color="success" round class="font-weight-light">View Profile</v-btn>
                  </v-card-text>
                </material-card>
              </v-flex>
              <v-flex v-if="index != historyRecords.length-1">
                <div style="height:100%;padding-top: 150px;">
                  <span class="arrow">&#8592;</span>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-container>
    </v-flex>
  </v-layout>
</template>

<script>
import axios from "../axios";
import {
  LMap,
  LIconDefault,
  LTileLayer,
  LMarker,
  LPolygon
} from "vue2-leaflet";

export default {
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIconDefault,
    LPolygon
  },
  data() {
    return {
      land: {},
      owner: {},
      historyRecords: [],
      zoom: 17,
      center: { lat: 12, lng: 70 },
      url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      coordinates: []
    };
  },
  methods: {
    downloadDoc() {
      axios({
        url: "http://localhost:8080/ipfs/" + this.land.documents[0].Hash,
        method: "GET",
        responseType: "blob"
      }).then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", this.land.documents[0].Name);
        document.body.appendChild(link);
        link.click();
      });
    },
    getLatLonCenterFromGeom(coordinates) {
      const arrAvg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

      const centerLat = arrAvg(coordinates.map(c => c.lat));
      const centerLon = arrAvg(coordinates.map(c => c.lng));

      if (isNaN(centerLat) || isNaN(centerLon)) return null;
      else return { lat: centerLat, lng: centerLon };
    }
  },
  async created() {
    this.land = this.$route.query;
    if (this.land.documents) {
      this.land.documents = JSON.parse(this.land.documents);
    }
    try {
      var res = await axios.get(
        "/api/org.landreg.landregistry.User/" + this.land.owner.split("#")[1]
      );
      this.owner = res.data;
    } catch (error) {
      console.log("error: ", error);
    }

    var coordinates = JSON.parse(this.land.coordinates).map(coordinate => {
      return {
        lat: parseFloat(coordinate.lat),
        lng: parseFloat(coordinate.lng)
      };
    });
    this.coordinates = coordinates;
    this.center = this.getLatLonCenterFromGeom(coordinates);

    try {
      // First element Owner
      this.historyRecords.push({ ...this.owner, landId: this.land.landId });

      var query = {
        where: {
          land: "resource:org.landreg.landregistry.Land#" + this.land.landId
        }
      };
      var transactions = await axios.get(
        "/api/org.landreg.landregistry.processMuncipalitySellRequest",
        {
          params: {
            filter: JSON.stringify(query)
          }
        }
      );
      transactions.data.forEach(async trx => {
        var user = await axios.get(
          "/api/org.landreg.landregistry.User/" + trx.prevOwner
        );
        var history = { ...user.data };
        history.timeStamp = trx.timestamp;
        history.landId = trx.land.split("#")[1];
        history.transactionId = trx.transactionId;
        this.historyRecords.push(history);
        this.historyRecords.sort(function(a, b) {
          a = new Date(a.timeStamp);
          b = new Date(b.timeStamp);
          return a > b ? -1 : a < b ? 1 : 0;
        });
      });

      if (this.land.partOf) {
        var query = {
          where: {
            land: "resource:org.landreg.landregistry.Land#" + this.land.partOf
          }
        };
        var parentLandTrx = await axios.get(
          "/api/org.landreg.landregistry.processMuncipalitySellRequest",
          {
            params: {
              filter: JSON.stringify(query)
            }
          }
        );
        parentLandTrx.data.forEach(async trx => {
          var user = await axios.get(
            "/api/org.landreg.landregistry.User/" + trx.prevOwner
          );
          var history = { ...user.data };
          history.timeStamp = trx.timestamp;
          history.transactionId = trx.transactionId;
          history.landId = trx.land.split("#")[1];
          this.historyRecords.push(history);
          this.historyRecords.sort(function(a, b) {
            a = new Date(a.timeStamp);
            b = new Date(b.timeStamp);
            return a > b ? -1 : a < b ? 1 : 0;
          });
        });
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }
};
</script>

<style scoped>
.mapouter {
  height: 400px;
  border: 3px solid lightslategray;
  margin-bottom: 20px !important;
}
.cardTitle {
  padding: 10px;
}
.ownerTitles {
  color: brown;
  font-weight: bold;
  margin-right: 5px;
}
#map {
  overflow: scroll;
  width: 100%;
  height: 100%;
}
.historyList {
  overflow-x: scroll;
}
.historyList::-webkit-scrollbar {
  display: none;
}
.arrow {
  font-size: 40px;
  font-weight: bold;
  color: lightslategray;
  margin-left: 10px;
}
.downloadBtn {
  margin-left: 5px;
  margin-top: 5px;
  margin-bottom: -3px;
  color: #50af50;
}
.documentField:hover {
  color: green;
  cursor: -webkit-grabbing;
}
</style>
