<template>
  <div class='topic-wrapper' v-loading="loading">
    <h1 class='title' >
      {{content.title}}
    </h1>
    <div class='info-wrapper'>
      <div class='nickName'>{{content.nick_name||""}}</div>
      <div>
        <span class='time'>{{time}}</span>
        <span class='browser'>浏览{{content.browser_num||0}}</span>
        <span class='comment'>评论{{content.comment_num||0}}</span>
      </div>
    </div>
      <div class='content' ref='content'>
      </div>
      <div class='sc-wrapper'>
        <div class=''>
          <div class='sc' @click='coll'>
            <span class='icon-sc' :class='content.is_collect==1?"active":""'></span>
            <span>收藏</span> 
          </div>
          <div class='zan' @click='zan'>
            <span class='icon-thumb_up' :class='content.is_like==1?"active":""'></span>
            <span>赞</span>
          </div>
        </div>
        <div class='fx'>
          <span>分享到: </span>
          <span class='icon-wx'></span>
        </div>
      </div>
      <!-- 发布评论模块 -->
      <div  class='comment-wrapper' v-if='isLogin'>
        <el-input type='textarea' resize='none' v-model='comment' placeholder="请输入评论内容">
        </el-input>
        <div class='btn'>
          <el-button type='danger' >发布评论</el-button>
        </div>
      </div>
      <div class='go-login' v-else>
        <p>
          未登录不能发布评论，请先
          <router-link to='login'>登录</router-link>
          ，或
          <router-link to='register'>注册</router-link>
        </p>
      </div>
      <!-- 评论列表 -->
      <div v-if='commentList.length&&commentList.length>0' class='comment-list' @click='hiddenRecomment($event)'>
        <ul>
          <li v-for='item in commentList' :key='item.topic_comment_id' class='comment-item'>
            <div>
            <div class='content-wrapper'>
              <img v-lazy='item.avatar' class='avatar'>
              <span class='fh'>:</span>
              <span>{{item.content}}</span>
            </div>
            <div class='comment-btn-wrapper'>
              <span class='time'>{{getTime(item.c_time)}}</span>
              <span class='re-comment' @click='showReComment($event,item)'>
                回复{{ifHasComment(item)}}
              </span>
            </div>
            </div>
            <!-- 子评论 -->
            <div class='sub-comment-wrapper' v-if='retopic_id==item.topic_comment_id' @click='nothing($event)'>
              <div class='sub-comment'>
                <el-input type='textarea' resize='none' v-model='comment' placeholder="请输入评论内容"></el-input>
                <div class='btn'>
                  <el-button type='danger' >发布评论</el-button>
                </div>
              </div>
              <ul>
                <li v-for='(subitem,index) in item.child' :key='index+subitem.topic_comment_id' class='sub-recomment-item'>
                  <div class='sub-avatar'>
                    <img v-lazy='subitem.avatar'>
                  </div>回复:
                  <div class='sub-content'> {{subitem.content}}</div>
                </li>
              </ul>
              </div>
          </li>
        </ul>
        <!-- 加载按钮 -->
        <div v-if='!moreComment' class='more-btn'>
          <el-button type='danger' @click='getCommentList'>加载更多</el-button>
        </div>
        <div v-else class='no-more'>
          <img src="../../common/imgs/end.png">
        </div>
      </div>
  </div>
</template>
<script>
import Axios from 'axios'
import {UnixTimeToDateTime} from 'common/js/UnixTimeToDateTime.js'

export default {
  data(){
    return {
      content:{},
      comment:'',
      commentList:[],
      moreComment:true,
      loading: true,
      page:1,
      topic_id:'',
      retopic_id:''
    }
  },
  created(){
    //查询信息
    let params={}
    if(this.isLogin){
      let u = JSON.parse(sessionStorage.getItem('user'))
      params.user_id = u.user_id
      params.token = u.token
    }
    params.topic_id = this.$route.params.topic_id
    this.topic_id = params.topic_id
    //获取文章信息
    Axios.post('/api/iweb/topic/queryDetail',params).then((res)=>{
         if(res.data.status==1){
            //显示文章数据
            this.loading = false
            this.content = res.data.data
            this.$refs.content.innerHTML = this.content.content
            this.getCommentList();
         }else{
           this.$message.error('加载失败')
         }
      })
    this.content = this.$route.params.articleObj || ''
  },
  computed:{
    time(){
      return new Date(parseInt(this.content.c_time) * 1000).toLocaleString().replace(/:\d{1,2}$/,' ')
    },
    isLogin(){
      return JSON.parse(sessionStorage.getItem('user'))
    }
  },
  mounted(){
  },
  methods:{
    nothing(event){
      event.stopPropagation();
    },
    hiddenRecomment(event){
      if(this.retopic_id!=''){
        this.retopic_id =''
      }
      // this.retopic_id=''
    },
    showReComment(event,comment){
      this.retopic_id = comment.topic_comment_id
      event.stopPropagation();
    },
    ifHasComment(item){
      if(item.child){
        return '('+item.child.length+')'
      }else{
        return ''
      }
    },
    //请求评论列表
    getCommentList(){
      Axios.get('/api/iweb/comment/commentOneClass',{
        params:{
          topic_id:this.topic_id,
          page:this.page
        }
      }).then((res)=>{
        if(res.data.status==1){
          this.moreComment = (res.data.data.current_page==res.data.data.last_page)&&res.data.data.current_page!=1
          this.commentList = this.commentList.concat(res.data.data.list) 
          this.page++;
        }else{
          this.$message.error('评论加载失败')
        }
      })
    },
    //点赞和收藏
    zan(){
        Axios.post('/api/iweb/like/topic_like',{
          user_id:this.isLogin.user_id,
          topic_id:this.topic_id,
          token:this.isLogin.token
        }).then((res)=>{
          if(res.data.status==1){
            this.$message.success(res.data.info)
            this.content.is_like = this.content.is_like==0?1:0
          }
        })
    },
    coll(){
        Axios.post('/api/iweb/collect/topic_collect',{
          user_id:this.isLogin.user_id,
          topic_id:this.topic_id,
          token:this.isLogin.token
        }).then((res)=>{
          if(res.data.status==1){
            this.$message.success(res.data.info)
            this.content.is_collect = this.content.is_collect==0?1:0
          }
        })
    },
    getTime(time){
      return UnixTimeToDateTime(time)
    },
  }
}
</script>
<style lang="stylus" scoped>
@import '../../common/css/variable.styl';
  .topic-wrapper
    margin:0 auto
    padding:30px 0px
    width:100%
    max-width:1100px
    min-width:960px
    .title
      text-align:center
      font-size:28px
      line-height:42px
    .info-wrapper
      text-align:center
      font-size:14px
      color:$color-desc
      line-height:20px
      & span
        margin-left:5px
    .content
      padding:0px 10px
      margin:50px 0px 20px 0px
    .sc-wrapper
      display:flex
      justify-content :space-between
      border-top:1px solid $color-desc
      &>div:first-child
        display :flex
        color:$color-title
        .sc,.zan
          cursor pointer 
          &:hover
            color:$color-active
        span
          vertical-align :middle
        .icon-sc,.icon-thumb_up
          margin-left:10px
          font-size:18px
          line-height:40px
          &.active
            color:$color-active
      .fx
        line-height:40px  
        font-size:18px
        vertical-align :middle
        .icon-wx
          font-size:24px
          position relative
          top:4px
          cursor pointer
    .comment-wrapper
      margin-top:20px
      & textarea
        height:90px
      .btn
        text-align:right
        margin:10px 10px 0px 0px
    .go-login
      margin-top:20px
      height:90px
      text-align:center
      line-height:90px
      a:hover
        color:$color-active
    .comment-list
      margin-top:20px
      background-color:#f7f8fa
      .comment-item
        padding:10px
        margin-bottom:10px
        border-bottom:1px solid #dcdcdc
        &>div
          display :flex
          justify-content :space-between
          .content-wrapper
            display :flex
            align-items:center
            .avatar
              flex:0 0 45px
              width:45px
              height:45px
            .fh
              flex:0 0 5px
            span 
              flex:1
              margin-left:5px
        .sub-comment-wrapper
          display :block
          width:85%
          margin-left :60px
          .sub-comment
            padding:10px
            background-color:#efefef
            .btn
              margin-top:10px
              text-align:right
          ul
            .sub-recomment-item
              display :flex
              align-items:center
              padding:10px
              border-bottom:1px solid #dcdcdc
              .sub-avatar
                margin-left:10px
                img
                  width:50px
                  height:50px
        .comment-btn-wrapper
          flex:0 0 150px
          display :flex
          align-items:center
          .time
            width:70px
          .re-comment
            margin-left:5px
            color:$color-active
            cursor pointer
      .more-btn,.no-more
        padding:10px
        text-align:center
        
</style>
