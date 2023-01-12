/*
 * @Author: jiaminghui
 * @Date: 2023-01-04 22:31:49
 * @LastEditTime: 2023-01-12 21:45:30
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\test.js
 * @Description: 
 */
console.log([null].toString() === "")

var arr = [1,2,3,4];
console.log(arr);
delete arr[1];
delete arr[2];
console.log(arr);
console.log(arr.length);
for (var i = 0; i < arr.length; i++){
    console.log(arr[i])
}
var bbbb = [];
bbbb[0] = 5;
bbbb[2] = 10;
console.log(bbbb);
console.log("***********")
console.log(String({}));
console.log(String([null]))

console.log(typeof ([3] + 0));
console.log(typeof(["32"] + 0));

console.log([ 42 ] < [ "043" ])

var obj111 = {
    a:10,
}
var obj222 = {
    a:11,
}
console.log(obj111.toString())
console.log(obj222.toString())
console.log(obj111 == obj222);
console.log(obj111 < obj222);
console.log(obj111 <= obj222);
console.log(obj111 > obj222);
console.log(obj111 >= obj222);