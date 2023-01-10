/*
 * @Author: jiaminghui
 * @Date: 2023-01-04 22:31:49
 * @LastEditTime: 2023-01-10 21:19:27
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