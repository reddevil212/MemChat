(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[42],{1125:(e,t,r)=>{var a=Object.create,s=Object.defineProperty,l=Object.getOwnPropertyDescriptor,i=Object.getOwnPropertyNames,n=Object.getPrototypeOf,o=Object.prototype.hasOwnProperty,p=(e,t,r)=>t in e?s(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,h=(e,t,r,a)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let n of i(t))o.call(e,n)||n===r||s(e,n,{get:()=>t[n],enumerable:!(a=l(t,n))||a.enumerable});return e},d=(e,t,r)=>(p(e,"symbol"!=typeof t?t+"":t,r),r),u={};((e,t)=>{for(var r in t)s(e,r,{get:t[r],enumerable:!0})})(u,{default:()=>P}),e.exports=h(s({},"__esModule",{value:!0}),u);var y=((e,t,r)=>(r=null!=e?a(n(e)):{},h(!t&&e&&e.__esModule?r:s(r,"default",{value:e,enumerable:!0}),e)))(r(2115)),c=r(9694),m=r(9650);class P extends y.Component{constructor(){super(...arguments),d(this,"callPlayer",c.callPlayer),d(this,"playerID",this.props.config.playerId||`twitch-player-${(0,c.randomString)()}`),d(this,"mute",()=>{this.callPlayer("setMuted",!0)}),d(this,"unmute",()=>{this.callPlayer("setMuted",!1)})}componentDidMount(){this.props.onMount&&this.props.onMount(this)}load(e,t){let{playsinline:r,onError:a,config:s,controls:l}=this.props,i=m.MATCH_URL_TWITCH_CHANNEL.test(e),n=i?e.match(m.MATCH_URL_TWITCH_CHANNEL)[1]:e.match(m.MATCH_URL_TWITCH_VIDEO)[1];if(t){i?this.player.setChannel(n):this.player.setVideo("v"+n);return}(0,c.getSDK)("https://player.twitch.tv/js/embed/v1.js","Twitch").then(t=>{this.player=new t.Player(this.playerID,{video:i?"":n,channel:i?n:"",height:"100%",width:"100%",playsinline:r,autoplay:this.props.playing,muted:this.props.muted,controls:!!i||l,time:(0,c.parseStartTime)(e),...s.options});let{READY:a,PLAYING:o,PAUSE:p,ENDED:h,ONLINE:d,OFFLINE:u,SEEK:y}=t.Player;this.player.addEventListener(a,this.props.onReady),this.player.addEventListener(o,this.props.onPlay),this.player.addEventListener(p,this.props.onPause),this.player.addEventListener(h,this.props.onEnded),this.player.addEventListener(y,this.props.onSeek),this.player.addEventListener(d,this.props.onLoaded),this.player.addEventListener(u,this.props.onLoaded)},a)}play(){this.callPlayer("play")}pause(){this.callPlayer("pause")}stop(){this.callPlayer("pause")}seekTo(e,t=!0){this.callPlayer("seek",e),t||this.pause()}setVolume(e){this.callPlayer("setVolume",e)}getDuration(){return this.callPlayer("getDuration")}getCurrentTime(){return this.callPlayer("getCurrentTime")}getSecondsLoaded(){return null}render(){return y.default.createElement("div",{style:{width:"100%",height:"100%"},id:this.playerID})}}d(P,"displayName","Twitch"),d(P,"canPlay",m.canPlay.twitch),d(P,"loopOnEnded",!0)}}]);