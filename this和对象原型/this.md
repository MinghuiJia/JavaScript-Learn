<!--
 * @Author: jiaminghui
 * @Date: 2022-12-07 20:46:41
 * @LastEditTime: 2022-12-07 22:38:49
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\this和对象原型\this.md
 * @Description: 
-->
# this的学习

## 关于this

### 用this的原因
1.  使用this可以在不同的上下文对象中重复使用函数，而不用针对每个对象编写不同版本的函数
    ```javascript
    function identify() {
        return this.name.toUpperCase();
    }
    function speak() {
        var greeting = "Hello, I'm " + identify.call( this );
        console.log( greeting );
    }
    var me = {
        name: "Kyle"
    };
    var you = {
        name: "Reader"
    };
    identify.call( me ); // KYLE
    identify.call( you ); // READER
    speak.call( me ); // Hello, 我是 KYLE
    speak.call( you ); // Hello, 我是 READER
    ```
    - 上述代码中，在函数`identify`与`speak`中使用this，可以被不同的对象`me`与`you`使用
    - 如果不使用this，则需要给`identify`与`speak`函数显式地传递对象引用
    ```javascript
    function identify(context) {
        return context.name.toUpperCase();
    }
    function speak(context) {
        var greeting = "Hello, I'm " + identify( context );
        console.log( greeting );
    }
    identify( you ); // READER
    speak( me ); //hello, 我是 KYLE
    ```
    - this提供了一种更优雅的方式来隐式“传递”一个对象引用，因此可以将API设计得更加简洁并且易于复用
    - 显式传递上下文对象会让代码变得越来越混乱

### 对this的误解
1.  对this的误解分为两种
    - 指向自身：把this理解成指向函数自身
    - 指向它的作用域：this指向函数的作用域
2.  指向自身
    - 在函数内部引用函数自身的原因是：
        - **递归（从函数内部调用这个函数）**
        - 在函数第一次被调用后**自己解除绑定的事件处理器**
    - 由于**函数**可以看作是一个**对象**，那就可以在调用函数时**存储状态**（属性的值）
    - 但是除了函数对象还有许多更合适存储状态的地方
        ```javascript
        function foo(num) {
            console.log( "foo: " + num );
            // 记录 foo 被调用的次数
            this.count++;
        }
        foo.count = 0;
        var i;
        for (i=0; i<10; i++) {
            if (i > 5) {
                foo( i );
            }
        }
        // foo: 6
        // foo: 7
        // foo: 8
        // foo: 9
        // foo 被调用了多少次？
        console.log( foo.count ); // 0 -- WTF?
        ```
    - `console.log`输出了4次，即函数被调用了4次，但实际上`foo`存储的`count`变量输出却是0
    - `foo.count = 0;`的确向函数对象foo添加了一个属性count；但是this.count中的**this并不是指向那个函数对象**
    - `foo.count = 0;`其实创建了一个全局变量count，它的值为NaN（具体原理在后面会介绍到）
    - 解决计数的方式是使用词法作用域，创建一个对象`var data={count:0}`来记录函数被调用（`data.count++;`）的次数
    - 函数对象内部引用自身的方式：
        ```javascript
        function foo() {
            foo.count = 4; // foo 指向它自身
        }
        setTimeout( function(){
            // 匿名（没有名字的）函数无法指向自身
        }, 10 );
        ```
        - 具名函数，在它内部可以使用函数名称（`foo`）来引用自身
        - 匿名函数，无法从函数内部引用自身。唯一可以引用自身的匿名函数方式：`arguments.callee`，但这种方式已经被弃用
    - 可以引用函数对象，就可以实现利用函数对象的属性计数了（``）
        ```javascript
        function foo(num) {
            console.log( "foo: " + num );
            // 记录 foo 被调用的次数
            foo.count++;
        }
        foo.count=0
        var i;
        for (i=0; i<10; i++) {
            if (i > 5) {
                foo( i );
            }
        }
        // foo: 6
        // foo: 7
        // foo: 8
        // foo: 9
        // foo 被调用了多少次？
        console.log( foo.count ); // 4
        ```
        - 这种方式回避了this的使用，原理是使用了`foo`函数变量的词法作用域
    - 另一种方式是强制将this绑定到foo函数对象：
        ```javascript
        function foo(num) {
            console.log( "foo: " + num );
            // 记录 foo 被调用的次数
            this.count++;
        }
        foo.count=0
        var i;
        for (i=0; i<10; i++) {
            if (i > 5) {
                foo.call( foo, i );
            }
        }
        // foo: 6
        // foo: 7
        // foo: 8
        // foo: 9
        // foo 被调用了多少次？
        console.log( foo.count ); // 4
        ```
3.  指向它的作用域
    - 首先明确：this在任何情况下都**不指向函数的词法作用域**
    - 作用域也可以理解为**对象**，可见标识符都是对象内的属性，但是作用域对象无法通过JavaScript代码访问，只存在于JavaScript引擎内部
    - 下述代码中：
        ```javascript
        function foo() {
            var a = 2;
            this.bar();
        }
        function bar() {
            console.log( this.a );
        }
        foo(); // ReferenceError: a is not defined
        ```
        - `this.bar();`是错误的，争取的方式就是直接调用`bar()`，直接使用词法引用标识符
        - 试图通过this联通`foo`与`bar`的词法作用域，从而让`bar`可以访问`foo`作用域里的变量a是不可能的。因为不能使用this来引用一个词法作用域内部的东西

### this到底是什么
1.  this是在运行时进行绑定的，并不是在编写时绑定，它的上下文取决于函数调用时的各种条件
2.  this的绑定和函数声明的位置没有任何关系，只取决于函数的调用方式
3.  当一个函数被调用时，会创建一个活动记录（有时候也称为执行上下文）
    - 这个记录会包含函数在哪里被调用（调用栈）、函数的调用方法、传入的参数等信息
    - this就是记录的其中一个属性，会在函数执行的过程中用到

## this全面解析