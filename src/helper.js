module.exports = {
    getShortPosition: (position) => {
        return Number(position.toString().substring(0,8));
    },
    createGuid(){
        return this.guid4() + this.guid4() + '-' + this.guid4() + '-' + 
        this.guid4() + '-' + this.guid4() + '-' + this.guid4() + this.guid4() + this.guid4();  
    },
    guid4(){
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); 
    },
}