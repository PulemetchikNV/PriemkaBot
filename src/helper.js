module.exports = {
    howManyInArr(x, arr){
        let count = 0
        for(i = 0; i < arr.length; i++)
        if(arr[i] == x)
            count++;
        return count;
    },
    isNumeric(num){
        return !isNaN(num)
    },
    splitter(text){
        const codes = text.split(`\n`)
        const condition ={}
        codes.forEach(code => {
            if(this.howManyInArr(code, codes) != 0 && this.isNumeric(code) === true){
                condition[`${code}`] = this.howManyInArr(code, codes)
            }
        })
        return condition
    },
    getLength(obj){
        let count = 0
        for(let values of Object.keys(obj)){
            count += 1
        }
        return count
    }
    
}