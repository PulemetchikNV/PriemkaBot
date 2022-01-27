const { Scenes:{BaseScene, Stage}, session, Telegraf, Markup } = require('telegraf');
const mysql = require('mysql')
const helper = require('./helper')
const config = require('./config')
const kb = require('./keyboard')
const kbBtns = require("./kb-btns");
const { generateID } = require('./helper');

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
const selectFromUsers = 'SELECT * FROM users' 

const bot = new Telegraf(config.TOKEN)

const DelUser = DelUserScene()
const DelItem = DelItemScene()

const adm_requestName = nameScene(AdminFunctional)
const adm_requestCount = countScene(AdminFunctional) 
const adm_requestCode = codeScene(AdminFunctional)
const adm_addData = addScene(AdminFunctional)


const startPriemka = startScene()
const rec_requestName = nameScene(PriemkaFunctional)
const rec_requestCount = countScene(PriemkaFunctional) 
const rec_requestCode = codeScene(PriemkaFunctional)
const rec_addData = addScene(PriemkaFunctional)
const barChange = barChangeScene()
const howMuchCodes = howMuchCodesScene()
const stage = new Stage([
    DelUser,
    DelItem, 
    adm_requestName,
    adm_requestCount, 
    adm_requestCode, 
    adm_addData, 
    rec_requestName,
    rec_requestCount,
    rec_requestCode,
    rec_addData,
    startPriemka,
    barChange,
    howMuchCodes
])

bot.use(session())
bot.use(stage.middleware())

bot.command('/ResetDB', ctx=> {
    conn.query('delete from priemka_data', (err, result)=>{
        if(err){
            ctx.reply(`${err}`)
        }else{
            ctx.reply('priemka_data --- OK')
        }
    })
    conn.query('delete from priemka;', (err, result)=>{
        if(err){
            ctx.reply(`${err}`)
        }else{
            ctx.reply('priemka --- OK')
        }
    })
    

})
bot.on("message", ctx=>{
    const chatId = ctx.update.message.chat['id']
    const userId = ctx.update.message.from['id']
    const text = ctx.update.message.text

    getRole(function (err, results) {
        if(err){
            console.log("ERR:",err);
        }else{
            for(let result of results){  
//======================ADMIN====================================
                if(result['user_role'] === 'Admin' && result['user_id'] === userId){
                    switch(text){
                        case '/start':
                            ctx.reply("Вы вошли как администратор, Действия администратора:", Markup.keyboard(kb.admin))
                            break
                        case kbBtns.admin.delUser:
                            ctx.scene.enter('user')
                            break
                        case kbBtns.admin.delItem:
                            ctx.scene.enter('delItem')
                            break
                        case kbBtns.admin.addItem:
                            ctx.scene.enter('nameScene')
                            break
                        default:     
                                setTimeout(()=>{
                                    AdminFunctional(ctx)
                                }, 10)
                                break
                    }
//======================RECEIVER===================================
                }else if(result['user_role'] === 'Receiver' && result['user_id'] === userId){
                    switch(text){
                        case '/start':
                            ctx.reply("Вы вошли как приёмщик, действия приёмщика:", Markup.keyboard(kb.receiver))
                            break
                        case kbBtns.receiver.start:
                            ctx.session.BarCount = {
                            }
                            ctx.session.BarCount['Всего'] = 0
                            conn.query('select item_barcode from items', (err, results)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    for(let result of results){
                                        ctx.session.BarCount[`${result['item_barcode']}`] = 0
                                    }
                                }
                            })
                            const RawDate = new Date()
                            const date = `${RawDate.getDate()}.${RawDate.getMonth() + 1}.${RawDate.getFullYear()}`
                            let status = 'Active'
                            const name = result['user_name']
                            conn.query(`insert into priemka(priemka_date, priemka_status, priemka_reciever) values('${date}', '${status}', '${name}')`, (err, result)=> {
                                if(err){
                                    console.log(err);
                                }else{
                                    for(let result of results){
                                        if(result['user_role'] === 'Admin'){
                                      
                                            ctx.telegram.sendMessage(result['user_chatId'], `Приёмка за ${date} открыта пользователем ${name}`)
                                        }
                                    }
                                }
                            })
                            ctx.reply(`Дата приёмки: ${date}`)
                            ctx.reply('Приёмка начата')
                            ctx.scene.enter('startScene')
                            break
                        case kbBtns.receiver.res:
                            let lastResut = ctx.session.res 
                            ctx.reply(`Штрихкодов просканированно: \n ${lastResut}`)
                            break
                        default:     
                            setTimeout(()=>{
                                ReceiverFunctional(ctx)
                            }, 10)
                            break
                    }
                }
            }      
        }
    })
    
})
bot.launch()
//===============================================FUNCTIONS=================================================// 
function GenId(length) {
    let ID = ''
    for(let i = 0; i < length; i++){
        ID += `${Math.floor(Math.random() * 10)}`
    }
    return ID
}
function AdminFunctional(ctx) {
    ctx.reply("Действия администратора:", Markup.keyboard(kb.admin))
}
function ReceiverFunctional(ctx) {
    setTimeout(()=>{
        ctx.reply("Действия приёмщика:", Markup.keyboard(kb.receiver))
    }, 10)
}
function PriemkaFunctional(ctx) {
    ctx.scene.enter('startScene')
}
function getRole(callback) {
    conn.query(selectFromUsers, (err, results) => {
        if(err){
            callback(err, null);
        }else{
            callback(null, results)
        }
        
    })   
}

function DelUserScene(){
    const user = new BaseScene('user')
    user.enter(async(ctx) => {
        await ctx.reply('Напишите ФИО пользователя, которого хотите удалить.', Markup.keyboard(kb.back))
    })
    user.on('text', async(ctx) => {
        if(ctx.message.text !== kbBtns.back.back){
            const chatId = ctx.update.message.chat['id']
            const name = ctx.message.text
            conn.query(`DELETE FROM users WHERE user_name = '${name}'`, (err, DELresults)=>{
                if(err){
                    console.log(err);
                }else{
                    if(DELresults['affectedRows'] !== 0){
                        ctx.telegram.sendMessage(chatId, `Пользователь удалён`)
                    }else{
                        ctx.telegram.sendMessage(chatId, `Данного пользователя нет в базе`)
                    }
                }
            })
        }else{
            AdminFunctional(ctx)
        }
        ctx.scene.leave()
  // или enter(другая сцена) 
    })
    return user
}
function DelItemScene() {
    const delItem = new BaseScene('delItem')
    delItem.enter(async(ctx) => {
        await ctx.reply('Напишите штрихкод предмета, который хотите удалить.', Markup.keyboard(kb.back))
    })
    delItem.on('text', async(ctx) => {
        if(ctx.message.text !== kbBtns.back.back){
            const chatId = ctx.update.message.chat['id']
            const barcode = ctx.message.text
            conn.query(`DELETE FROM items WHERE item_barcode = '${barcode}'`, (err, DELresults)=>{
            if(err){
                console.log(err);
            }else{
                if(DELresults['affectedRows'] !== 0){
                    ctx.telegram.sendMessage(chatId, `Предмет удалён`)
                }else{
                    ctx.telegram.sendMessage(chatId, `Данного предмета нет в базе`)
                }
            }
            })
        }else{
            AdminFunctional(ctx)
        }
        ctx.scene.leave()
    })
    return delItem
}
function nameScene(functional) {
    const nameScene = new BaseScene('nameScene')
    nameScene.enter(async(ctx) => {await ctx.reply('Назание товара:', Markup.keyboard(kb.back))})
    nameScene.on('text', async(ctx) => {
        if(ctx.message.text !== kbBtns.back.back){
            ctx.session.name = ctx.message.text
            ctx.scene.enter('countScene')
        }else{
            setTimeout(()=>{
                functional(ctx)
            }, 10)
            ctx.scene.leave()
        }
    })
    return nameScene
}
function countScene(functional) {
    const countScene = new BaseScene('countScene')
    countScene.enter(ctx => ctx.reply('Кол-во в одной упаковке:', Markup.keyboard(kb.back)))
    countScene.on('text', ctx => {
        if(ctx.message.text !== kbBtns.back.back){
            ctx.session.count = ctx.message.text
            ctx.scene.enter('codeScene')
        }else{
            setTimeout(()=>{
                functional(ctx)
            }, 10)
            ctx.scene.leave()
        }
        
    })
    return countScene
}
function codeScene(functional) {
    const codeScene = new BaseScene('codeScene')
    codeScene.enter(ctx => ctx.reply('Штрихкод:', Markup.keyboard(kb.back)))
    codeScene.on('text', ctx => {
        if(ctx.message.text !== kbBtns.back.back){
            ctx.session.barcode = ctx.message.text
            ctx.reply(`
            Проверте корректность введённых данных:\n
            Название: ${ctx.session.name} \n
            Количество: ${ctx.session.count} \n
            Штрихкод: ${ctx.session.barcode}`, Markup.keyboard(kb.apply)
            )
            ctx.scene.enter('addScene')
        }else{
            setTimeout(()=>{
                functional(ctx)
            }, 10)
            ctx.scene.leave()
        }
    })
    return codeScene
}
function addScene(functional) {
    const addScene = new BaseScene('addScene')
    addScene.on('text', ctx => {
        if(ctx.message.text === kbBtns.apply.apply){
            conn.query(`INSERT INTO items VALUES('${ctx.session.name}', ${ctx.session.count}, ${ctx.session.barcode})`, (err, INSresult)=> {
                {
                    if(err){
                        console.log(err);
                        ctx.reply('Ошибка базы данных, проверте корректность данных')
                        ctx.scene.leave()
                    }else{
                        ctx.reply('Товар добавлен')
                        ctx.scene.leave()
                    }
                }
            })
        }
        setTimeout(()=>{
            functional(ctx)
        }, 10)
        ctx.scene.leave()
    })
    return addScene
}


function startScene() {
    const startScene = new BaseScene('startScene')
    startScene.enter(ctx => setTimeout(()=>{ctx.reply('Принимаю штрихкод', Markup.keyboard(kb.priemka))}, 10))
    startScene.on('text', ctx => {
        if(helper.isNumeric(ctx.message.text)){
            conn.query(`select priemka_id from priemka where Priemka_status = 'Active'`, (err, ACresult)=>{
                if(err){
                    console.log(err);
                }else{
                    ctx.session.id = ACresult[0]['priemka_id']
                    conn.query(`insert into priemka_data values(${ctx.session.id}, '${ctx.message.text}')`, (err, STARTresult)=>{
                        if(err){
                            ctx.reply('Данного штрихкода нет в базе, вы можете добавить его в базу нажав на "Добавить товар"')
                            ctx.scene.reenter()
                        }else{
                            ctx.reply(`Штрихкод добавлен, ${ctx.message.text.split(`\n`)}`)
                            ctx.session.BarCount['Всего'] += 1
                            ctx.session.BarCount[`${ctx.message.text}`] += 1
                            ctx.scene.reenter()
                        }
                    })
                }
            })
            
        }else{
            switch(ctx.message.text){
                case kbBtns.priemka.end:
                    ctx.reply('Приёмка завершена')
                    conn.query(`update priemka set priemka_status = 'Completed' where priemka_status = 'Active'`, (err, result) => {
                        if(err){
                            console.log(err);
                        }
                    })
                    ReceiverFunctional(ctx)
                    ctx.scene.leave()
                    break
                case kbBtns.priemka.res:
                    ctx.session.res = ''
                    for(let value of Object.keys(ctx.session.BarCount)){
                        if(ctx.session.BarCount[value] != 0){
                            ctx.session.res += `${value} - ${ctx.session.BarCount[value]}\n`
                        }
                    }
                    ctx.reply(`Штрихкодов просканированно:\n ${ctx.session.res}`)
                    ctx.scene.reenter()
                    break
                case kbBtns.priemka.addItem:
                    ctx.scene.enter('nameScene')
                    break
                case kbBtns.priemka.changeCount:
                    ctx.scene.enter('barChangeScene')
                    break
                default:
                    ctx.reply(`Неверный формат штрихкода ${ctx.message.text.indexOf(`\n`)}`)
                    ctx.scene.reenter()
                    break
            }
        }
        
    })
    return startScene
}
function barChangeScene() {
    const barChange = new BaseScene('barChangeScene') 
    barChange.enter(ctx => setTimeout(()=>{ctx.reply('Введите штрихкод, количество которого хотите уменьшить', Markup.keyboard(kb.back))}, 10))
    barChange.on('text', ctx=> {
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.changeCode = ctx.message.text
            ctx.scene.enter('howMuchCodes')
        }else{
            ctx.scene.enter('startScene')
        }
        
    })
    return barChange
}
function howMuchCodesScene() {
    const howMuchCodes = new BaseScene('howMuchCodes') 
    howMuchCodes.enter(ctx => setTimeout(()=>{ctx.reply('Теперь укажите количество', Markup.keyboard(kb.back))}, 10))
    howMuchCodes.on('text', ctx=> {
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.changeCount = ctx.message.text
            conn.query(`select priemka_id from priemka where Priemka_status = 'Active'`, (err, BCresult)=>{
            if(err){console.log(err)}
            else{
                ctx.session.id = BCresult[0]['priemka_id']
                conn.query(`delete from priemka_data where Priemka_id = ${ctx.session.id} and Scanned_barcode = '${ctx.session.changeCode}' limit ${ctx.session.changeCount}`, (err, result)=>{
                    if(err){
                        console.log(err);
                        ctx.reply('Неверный формат данных')
                        ctx.scene.enter('startScene')
                    }else{
                        if(ctx.session.BarCount[`${ctx.session.changeCode}`] >= ctx.session.changeCount){
                            ctx.session.BarCount[`${ctx.session.changeCode}`] -= ctx.session.changeCount
                        }else{
                            ctx.session.changeCount = ctx.session.BarCount[`${ctx.session.changeCode}`]
                            ctx.session.BarCount[`${ctx.session.changeCode}`] = 0
                        }
                        ctx.session.BarCount['Всего'] -= ctx.session.changeCount
                        ctx.reply('Изменено')
                        ctx.scene.enter('startScene')
                    }
                })
            }
            })
        }else{
            ctx.scene.enter('startScene')
        }
    })
    return howMuchCodes
}