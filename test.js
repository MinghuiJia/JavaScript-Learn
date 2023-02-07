/*
 * @Author: jiaminghui
 * @Date: 2023-01-04 22:31:49
 * @LastEditTime: 2023-02-07 11:09:40
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

// Array.prototype.push = function(item) {
//     this[this.length-1] = item;
// };

var temp_arr = new Array(1,2,3);
console.log(temp_arr.length)
temp_arr[temp_arr.length] = 5;
console.log(temp_arr);


var a = 1; 
var b = 2; 
function *foo() { 
    a++; 
    yield; 
    b = b * a; 
    a = (yield b) + 3; 
} 
function *bar() { 
    b--; 
    yield; 
    a = (yield 8) + b; 
    b = a * (yield 2); 
}
function step(gen) { 
    var it = gen(); 
    var last; 
    return function() { 
        // 不管yield出来的是什么，下一次都把它原样传回去！
        last = it.next( last ).value; 
    }; 
} 
a = 1; 
b = 2; 
var s1 = step( foo ); 
var s2 = step( bar ); 
s2(); // b--; 
s2(); // yield 8  
s1(); // a++; 
s2(); // a = 8 + b; 
// yield 2 
s1(); // b = b * a; 
// yield b 
console.log(a,b);
// s1(); // a = b + 3; 
// s2(); // b = a * 2; 
// console.log(a,b);

var obj = {
    name1:"jmh",
    name2:"wgw",
    name3:"lx",
}

var obj2 = Object.create(obj);
obj2.work = "whu"
for (var i in obj2){
    console.log(i);
}

var foo = true;
if (foo) {
    let bar = foo * 2;
    console.log(bar);
    // bar = something( bar ); 
    // console.log( bar );
}
// console.log( bar ); // ReferenceError