import * as types from './mutation-type';


const mutations = {
    [types.SET_USER](state,user){
        state.user = user
    },
    [types.CLEAR_USER](state){
        state.user = {}
    }
}

export default mutations