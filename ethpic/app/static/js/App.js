import React from 'react';
import Navbar from './Navbar';
import Login from './Login';
import Gallery from './Gallery';
import Map from './Map';
import Upload from './Upload';
import update from "react-addons-update";
import lightwallet from 'eth-lightwallet';
import async from 'async';
import Web3 from 'web3';
import HookedWeb3Provider from 'hooked-web3-provider';

var App = React.createClass ({
  getInitialState(){
    return{
      loggedIn: false,
      requestLogin: true,
      dashOpen: false,
      uploaderOpen: false,
      userName: '',
      curLat : 22,
      curLng : 87,
      markers: [],
      // {
      //   position: {
      //     lat: 22.314544,
      //     lng: 87.309068,
      //   },
      //   key: `IIT KGP`,
      //   content: false,
      //   showInfo: false,
      //   defaultAnimation: 2,
      //   userid: 0,
      //   imageid: 0,
      //   imageUrl:'https://unsplash.it/800/800?image=234',
      //   title:'',
      //   tags:['tag1', 'tag2' , 'tag3' ],
      //   upvotes:'2',
      // }],
      data: [],
      // {
      //   id: 1,
      //   name: "Island",
      //   image: "https://images.unsplash.com/photo-1442530792250-81629236fe54?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=980&h=980&fit=crop&s=9631adb2d2f752e3a0734f393fef634b"
      // }
      global_keystore: '',
      addresses: [],
      web3: '',
      ether: []
    }
  },

  render() {
    return (
      <div className="App">
        <Navbar loggedIn={this.state.loggedIn} showLogin={this.showLogin}  showDash={this.showDash} userName={this.state.userName}/>
        <Login requestLogin={this.state.requestLogin} cancelLogin={this.cancelLogin} doLogin={this.doLogin} doSignUp={this.doSignUp}/>
        <Map ref="map" markerData={this.state.markers} setCurLatLng={this.setCurLatLng} toggleShowUpload={this.toggleShowUpload} updateMarkers={this.updateMarkers}/>
        <Gallery ether={this.state.ether} showUserPics={this.showUserPics} data={this.state.data} addresses={this.state.addresses} open={this.state.dashOpen} getBalances={this.getBalances} hideDash={this.hideDash} logout={this.logout} username={this.state.userName}/>
        <Upload showUserPics={this.showUserPics} markerData={this.state.markers} addresses={this.state.addresses} updateMarkers={this.updateMarkers} setCurLatLng={this.setCurLatLng} toggleShowUpload={this.toggleShowUpload} showUpload={this.state.uploaderOpen} loggedIn={this.state.loggedIn} user={this.state.userName} curLat={this.state.curLat} curLng={this.state.curLng}/>
      </div>
    );
  },

  updateMarkers(marker){
    this.setState({markers:marker});
    console.log('marker data from app:');
    console.log(this.state.markers);
  },

  toggleShowUpload(){
    this.setState({uploaderOpen: this.state.uploaderOpen ? false : true, dashOpen: false})
    this.refs.map.closeImageView();
  },

  setCurLatLng(point){
    this.setState({curLng: point.lng(), curLat: point.lat()});
  },

  showLogin(){
    this.setState({requestLogin:true});
    this.refs.map.closeImageView();
  },

  cancelLogin(){
    this.setState({requestLogin:false});
  },

  doLogin(user,pswd){
    this.setState({requestLogin:false, loggedIn: true, userName: user});
    this.showUserPics();
  },

  doSignUp(password){
    
    console.log('Generate the words and store them as username... the password is : ', password);
    var randomSeed = lightwallet.keystore.generateRandomSeed();
    console.log(randomSeed);

    var that = this;
    lightwallet.keystore.createVault({
      password: password,
      seedPhrase: randomSeed, // Optionally provide a 12-word seed phrase
      // salt: fixture.salt,     // Optionally provide a salt.
                                 // A unique salt will be generated otherwise.
      // hdPathString: hdPath    // Optional custom HD Path String
    }, function (err, ks) {

      // Some methods will require providing the `pwDerivedKey`,
      // Allowing you to only decrypt private keys on an as-needed basis.
      // You can generate that value with this convenient method:
      ks.keyFromPassword(password, function (err, pwDerivedKey) {
        if (err) throw err;

        // generate five new address/private key pairs
        // the corresponding private keys are also encrypted
        ks.generateNewAddress(pwDerivedKey, 1);
        var addr = ks.getAddresses();
        console.log(ks);

        that.setState({
              requestLogin:false, 
              loggedIn: true, 
              userName: 'Generate Something', 
              global_keystore: ks,
              addresses: addr
            });
        // ks.passwordProvider = function (callback) {
        //   var pw = prompt("Please enter password", "Password");
        //   callback(null, pw);
        // };

        // Now set ks as transaction_signer in the hooked web3 provider
        // and you can start using web3 using the keys/addresses in ks!
      });
    });
  },

  getBalances() {
    var ks = this.state.global_keystore;
    console.log(ks);
    var addresses = ks.getAddresses();
    console.log(addresses);

    var web3 = new Web3();
    var web3Provider = new HookedWeb3Provider({
      host: "http://localhost:8545",
      transaction_signer: ks
    });

    web3.setProvider(web3Provider);

    var that = this;
    async.map(addresses, web3.eth.getBalance, function(err, balances) {
      console.log(addresses, balances);
      var ethers = [];
      balances.forEach(function(new_listitem, j){
        ethers.push(new_listitem/1.0e18);
      });
      that.setState({ether: ethers});
    });

  },

  showDash(){
    this.setState({dashOpen:true, uploaderOpen:false});
    this.getBalances();
    this.refs.map.closeImageView();
  },

  hideDash(){
    this.setState({dashOpen:false});
    this.refs.map.closeImageView();
  },

  logout(){
    this.setState({data: []});
    this.setState({dashOpen: false, loggedIn: false});
  },

  showUserPics() {
    this.setState({data: []});
    var that = this;

    ethDB.getNumberOfPhotos().then(function(photos){
      
      var arr = [...Array(photos.c[0]).keys()];
      console.log(arr);

      arr.forEach(function(listitem, curr){
        ethDB.getPhoto(curr).then(function(values){

          console.log(values);
          let { data } = that.state;
          data = update(data, {
            $push: [
              {
                id: curr,
                name: "",
                image: EmbarkJS.Storage.getUrl(values[1])
              }
            ],
          });
          that.setState({ data });

        });
      });
    });
  }

})

export default App;
