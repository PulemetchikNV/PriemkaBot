module.exports = {
    getChatId(msg){
        return msg.chat.id
    },
    getUserId(msg){
        return msg.from.id
    },
    generateID(){
        id = ''
        for(let i = 0; i < 10; i++){
            id += Math.floor(Math.random() * 10)
        }
        return id
    },
    
    
}