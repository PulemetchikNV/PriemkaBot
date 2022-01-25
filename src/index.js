const TelegramBot = require('node-telegram-bot-api')
const mysql = require('mysql')
const helper = require('./helper')
const config = require('./config')
const kb = require('./keyboard')
const kbBtns = require("./kb-btns")
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "priemkabot",
    password: "password"
})

conn.connect(err =>{
    if(err){
        console.log(err)
    }else{
        console.log('Database ------ ok');
    }
})
const bot = new TelegramBot(config.TOKEN, {
    polling: true
})
const selectFromUsers = 'SELECT * FROM users' 
bot.on("message", msg=>{
    const chatId = helper.getChatId(msg)
    const userId = helper.getUserId(msg)
    const text = msg.text.toLowerCase()
    //======================ADMIN====================================
    
    getRole(function (err, results) {
        if(err){
            console.log("ERR:",err);
        }else{
            for(let result of results){  
                if(result['user_role'] === 'Admin' && result['user_id'] === userId){
                    if(text.includes('упол - ')){
                        delUser(text, conn, chatId)
                    }
                    if(text.includes('утов - ')){
                        delItem(text, conn, chatId)
                    }
                    if(text.includes('доб - ')){
                        AddItem(text, conn, chatId)
                    }

                    switch(msg.text){
                        case '/start':
                            bot.sendMessage(chatId, "Вы вошли как администратор, Действия администратора:", {
                                reply_markup: {
                                    keyboard: kb.admin
                                }
                            })
                            
                            break
                        case kbBtns.admin.delUser:
                                bot.sendMessage(chatId, `Введите ФИО пользоателя, которого хотите удалить, в формате: "УПОЛ - *Имя пользователя*"`, {
                                    reply_markup: {
                                        keyboard: kb.back
                                    }
                                })
                                break
                        case kbBtns.admin.delItem:
                                bot.sendMessage(chatId, `Введите код предмета, который хотите удалить, в формате: "УТОВ - *Код товара*"`, {
                                    reply_markup: {
                                        keyboard: kb.back
                                    }
                                })
                                break
                        case kbBtns.admin.addItem:
                            bot.sendMessage(chatId, `Введите данные предмета, который хотите добавить, в формате: "ДОБ - *название* *кол-во в упаковке* *штрихкод упаковки*"`, {
                                reply_markup: {
                                    keyboard: kb.back
                                }
                            })
                            break
                        default:
                                function AdminFunctional(chatId) {
                                    bot.sendMessage(chatId, "Действия администратора:", {
                                        reply_markup: {
                                            keyboard: kb.admin
                                        }
                                    })
                                }
                                setTimeout(()=>{
                                    AdminFunctional(chatId)
                                }, 10)
                                break
                    }
                }
            }      
        }
    })
    //======================RECEIVER====================================
    getRole(function (err, results) {
        if(err){
            console.log("ERR:",err);
        }else{
            for(let result of results){
                if(result['user_role'] === 'Receiver' && result['user_id'] === userId && msg.text === kbBtns.role.Auth){
                    bot.sendMessage(chatId, "Вы вошли как приёмщик")
                };
            }
            
        }
    })

})
bot.onText(/\/start/, msg=>{
    const chatId = helper.getChatId(msg)
    const userId = helper.getUserId(msg)
    getRole(function (err, results) {
        if(err){
            console.log("ERR:",err);
        }else{
            for(let result of results){
                if(result['user_role'] === 'Admin' && result['user_id'] === userId && msg.text === kbBtns.role.Auth){
                    
                }
                
            }
            
        }
    })
    
})
//===============================================FUNCTIONS=================================================// 
function getRole(callback) {
    conn.query(selectFromUsers, (err, results) => {
        if(err){
            callback(err, null);
        }else{
            callback(null, results)
        }
        
    })   
}
function delUser(text, conn, chatId) {

        const name = text.substring(7)
        conn.query(`DELETE FROM users WHERE user_name = '${name}'`, (err, DELresults)=>{
            if(err){
                console.log(err);
            }else{
                if(DELresults['affectedRows'] !== 0){
                    bot.sendMessage(chatId, `Пользователь удалён`)
                }else{
                    bot.sendMessage(chatId, `Такого пользователя нет в базе`)
                }
            }    
            })
}
function delItem(text, conn, chatId) {
    const code = text.substring(7)
    conn.query(`DELETE FROM items WHERE item_barcode = '${code}'`, (err, DELresults)=>{
        if(err){
            console.log(err);
        }else{
            if(DELresults['affectedRows'] !== 0){
                bot.sendMessage(chatId, `Товар удалён`)
            }else{
                bot.sendMessage(chatId, `Такого товара нет в базе`)
            }
        }
    })    
}
function AddItem(text, conn, chatId) {
    const data = text.substring(6).split(' ')
    console.log(data);
}