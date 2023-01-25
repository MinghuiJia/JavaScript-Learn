<!--
 * @Author: jiaminghui
 * @Date: 2023-01-25 11:13:31
 * @LastEditTime: 2023-01-25 17:47:46
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\异步和性能\Promise.md
 * @Description: 
-->
# Promise的学习
回调存在控制反转问题，使得信任很脆弱，也很容易失去。如果我们能够把控制反转再反转回来，**希望第三方给我们提供了解其任务何时结束的能力，然后由我们自己的代码来决定下一步做什么**，这种范式就称为Promise
## 什么是Promise
1.  以购买汉堡为类比例子：由于我购买一个汉堡后不能马上就得到这个汉堡，**一张带有订单号的收据就是一个IOU（I owe you，我欠你的）承诺（promise）**，保证了最终我会得到我的汉堡。此外，尽管现在我还没有拿到手汉堡，但是我可以去做一些其他的事情，我的大脑之所以可以这么做，是因为它已经把订单号当作芝士汉堡的占位符了。**从本质上讲，这个占位符使得这个值不再依赖时间，这是一个未来值**。**未来值有一个重要特性：它可能成功，也可能失败**
2.  `x+y`这样一个运算表达式，期望x和y在都已经准备好的情况下再立即执行加法运算。但是这样会导致语句中既有现在又有将来，使得程序混乱。解决的方法之一就是使用回调来解决，将语句中全部转换为将来
    ```javascript
    function add(getX,getY,cb) { 
        var x, y; 
        getX( function(xVal){ 
            x = xVal; 
            // 两个都准备好了？
            if (y != undefined) { 
                cb( x + y ); // 发送和
            } 
        } ); 
        getY( function(yVal){ 
            y = yVal; 
            // 两个都准备好了？
            if (x != undefined) { 
                cb( x + y ); // 发送和
            } 
        } ); 
    } 
    // fetchX() 和fetchY()是同步或者异步函数
    add( fetchX, fetchY, function(sum){ 
        console.log( sum ); // 是不是很容易？
    } ); 
    ```
    - 在这段代码中，我们把x和y当作未来值，并且表达了一个运算`add(..)`，这个运算（从外部看）不在意x和y现在是否都已经可用。换句话说，它把现在和将来归一化了，因此我们可以确保这个`add(..)`运算的输出是可预测的
    - 为了统一处理现在和将来，我们把它们都变成了将来，即所有的操作都成了异步的
3.  通过Promise函数表达这个`x + y`的例子
    ```javascript
    function add(xPromise,yPromise) { 
        // Promise.all([ .. ])接受一个promise数组并返回一个新的promise，
        // 这个新promise等待数组中的所有promise完成
        return Promise.all( [xPromise, yPromise] ) 
        // 这个promise决议之后，我们取得收到的X和Y值并加在一起
        .then( function(values){ 
            // values是来自于之前决议的promisei的消息数组
            return values[0] + values[1]; 
        } ); 
    } 
    // fetchX()和fetchY()返回相应值的promise，可能已经就绪，
    // 也可能以后就绪 
    add( fetchX(), fetchY() ) 
    // 我们得到一个这两个数组的和的promise
    // 现在链式调用 then(..)来等待返回promise的决议
    .then( function(sum){ 
        console.log( sum ); // 这更简单！
    } ); 
    ```
    - `fetchX()`和`fetchY()`是直接调用的，它们的返回值（promise！）被传给`add(..)`
    - 这些promise代表的底层值的可用时间可能是现在或将来，但不管怎样，promise归一保证了行为的一致性。我们可以按照不依赖于时间的方式追踪值X和Y，它们是未来值
    - 第二层是`add(..)`（通过`Promise.all([ .. ])`）创建并返回的promise。我们通过调用`then(..)`等待这个promise。`add(..)`运算完成后，未来值sum就准备好了，可以打印出来。我们把等待未来值X和Y的逻辑隐藏在了`add(..)`内部
4.  Promise的决议结果可能是拒绝而不是完成。拒绝值和完成的Promise不一样：完成值总是编程给出的，而拒绝值，通常称为拒绝原因，可能是程序逻辑直接设置的，也可能是从运行异常隐式得出的值
    - 通过Promise，调用`then(..)`实际上可以接受两个函数，第一个用于完成情况（如前所示），第二个用于拒绝情况
        ```javascript
        add( fetchX(), fetchY() ) 
        .then( 
            // 完成处理函数
            function(sum) { 
                console.log( sum ); 
            }, 
            // 拒绝处理函数
            function(err) { 
                console.error( err ); // 烦！
            } 
        ); 
        ```
        - 如果在获取X或Y的过程中出错，或者在加法过程中出错，`add(..)`返回的就是一个被拒绝的promise，传给`then(..)`的第二个错误处理回调就会从这个promise中得到拒绝值
    - 由于Promise封装了依赖于时间的状态——等待底层值的完成或拒绝，所以Promise本身是与时间无关的。因此，Promise可以按照可预测的方式组成（组合），而不用关心时序或底层的结果
    - 另外，一旦Promise决议（准备好），它就永远保持在这个状态。此时它就成为了不变值，可以根据需求多次查看
5.  假定要调用一个函数`foo(..)`执行某个任务。我们不知道也不关心它的任何细节。这个函数可能立即完成任务，也可能需要一段时间才能完成。我们只需要知道`foo(..)`什么时候结束，这样就可以进行下一个任务。换句话说，我们想要通过某种方式在`foo(..)`完成的时候得到通知，以便可以继续下一步。在JavaScript中我们可以把对通知的需求重新组织为对`foo(..)`发出的一个完成事件的侦听
    - 使用回调的话，通知就是任务（`foo(..)`）调用的回调。而使用Promise的话，我们把这个关系反转了过来，侦听来自`foo(..)`的事件，然后在得到通知的时候，根据情况继续
        ```javascript
        foo(x) { 
            // 开始做点可能耗时的工作
        } 
        foo( 42 ) 
        on (foo "completion") { 
            // 可以进行下一步了！
        } 
        on (foo "error") { 
            // 啊，foo(..)中出错了
        } 
        ```
        - 我们调用`foo(..)`，然后建立了两个事件侦听器，一个用于"completion"，一个用于"error"——`foo(..)`调用的两种可能结果。从本质上讲，`foo(..)`并不需要了解调用代码订阅了这些事件，这样就很好地实现了关注点分离
        - 遗憾的是这种环境并不存在（实际上也有点不实际），以下是在JavaScript中更自然的表达方法
            ```javascript
            function foo(x) { 
                // 开始做点可能耗时的工作
                // 构造一个listener事件通知处理对象来返回
                return listener; 
            } 
            var evt = foo( 42 ); 
            evt.on( "completion", function(){ 
                // 可以进行下一步了！
            } ); 
            evt.on( "failure", function(err){ 
                // 啊，foo(..)中出错了
            } ); 
            ```
            - `foo(..)`显式创建并返回了一个事件订阅对象，调用代码得到这个对象，并在其上注册了两个事件处理函数
            - 相对于面向回调的代码，这里的反转是显而易见的，这里没有把回调传给`foo(..)`，而是返回一个名为evt的事件注册对象，由它来接受回调
            - 回调本身就表达了一种控制反转，所以Promise是对回调模式的反转，实际上是对反转的反转，或者称为反控制反转——把控制返还给调用代码
            - 一个很重要的好处是，可以把这个事件侦听对象提供给代码中多个独立的部分；在`foo(..)`完成的时候，它们都可以独立地得到通知，以执行下一步
                ```javascript
                var evt = foo( 42 ); 
                // 让bar(..)侦听foo(..)的完成
                bar( evt ); 
                // 并且让baz(..)侦听foo(..)的完成
                baz( evt ); 
                ```
                - 对控制反转的恢复实现了更好的关注点分离，其中`bar(..)`和`baz(..)`不需要牵扯到`foo(..)`的调用细节。类似地，`foo(..)`不需要知道或关注`bar(..)`和`baz(..)`是否存在，或者是否在等待`foo(..)`的完成通知
                - 从本质上说，evt对象就是分离的关注点之间一个中立的第三方协商机制
    -  Promise事件
        - 事件侦听对象evt就是Promise的一个模拟，在基于Promise的方法中，前面的代码片段会让`foo(..)`创建并返回一个Promise实例，而且这个 Promise会被传递到`bar(..)`和`baz(..)`
            ```javascript
            function foo(x) { 
                // 可是做一些可能耗时的工作
                // 构造并返回一个promise
                return new Promise( function(resolve,reject){ 
                    // 最终调用resolve(..)或者reject(..)
                    // 这是这个promise的决议回调
                } ); 
            } 
            var p = foo( 42 ); 
            bar( p ); 
            baz( p ); 
            ```
            - `new Promise( function(..){ .. } )`模式通常称为revealing constructor，传入的函数会立即执行（不会像`then(..)`中的回调一样异步延迟），它有两个参数，在本例中我们将其分别称为resolve和reject。这些是promise的决议函数。`resolve(..)`通常标识完成，而`reject(..)`则标识拒绝
        - `bar(..)`和`baz(..)`的内部实现或许如下
            ```javascript
            function bar(fooPromise) { 
                // 侦听foo(..)完成
                fooPromise.then( 
                    function(){ 
                        // foo(..)已经完毕，所以执行bar(..)的任务
                    }, 
                    function(){ 
                        // 啊，foo(..)中出错了！
                    } 
                ); 
            } 
            // 对于baz(..)也是一样
            ```
            - Promise决议并不一定要像前面将Promise作为未来值查看时一样会涉及发送消息。它也可以只作为一种流程控制信号，就像前面这段代码中的用法一样
        - 另外一种实现方式是
            ```javascript
            function bar() { 
                // foo(..)肯定已经完成，所以执行bar(..)的任务
            } 
            function oopsBar() { 
                // 啊，foo(..)中出错了，所以bar(..)没有运行
            } 
            // 对于baz()和oopsBaz()也是一样
            var p = foo( 42 ); 
            p.then( bar, oopsBar ); 
            p.then( baz, oopsBaz );
            ```
            - 这里没有把promise p传给`bar(..)`和`baz(..)`，而是使用promise控制`bar(..)`和`baz(..)`何时执行，如果执行的话。最主要的区别在于错误处理部分
            - 在第一段代码的方法里，不论`foo(..)`成功与否，`bar(..)`都会被调用。并且如果收到了`foo(..)`失败的通知，它会亲自处理自己的回退逻辑
            - 在第二段代码中，`bar(..)`只有在`foo(..)`成功时才会被调用，否则就会调用`oppsBar(..)`
            - 另外，两段代码都以使用promise p调用`then(..)`两次结束，这个事实说明了前面的观点，就是Promise（一旦决议）一直保持其决议结果（完成或拒绝）不变，可以按照需要多次查看，一旦p决议，不论是现在还是将来，下一个步骤总是相同的

### 具有then方法的鸭子类型
1.  在Promise领域，一个重要的细节是如何确定某个值是不是真正的Promise。或者更直接地说，它是不是一个行为方式类似于Promise的值
    - 既然Promise是通过`new Promise(..)`语法创建的，那你可能就认为可以通过`p instanceof Promise`来检查。但遗憾的是，这并不足以作为检查方法，原因有许多
        - 其中最主要的是，Promise值可能是从其他浏览器窗口（iframe等）接收到的。这个浏览器窗口自己的Promise可能和当前窗口/frame的不同，因此这样的检查无法识别Promise实例
        - 库或框架可能会选择实现自己的Promise，而不是使用原生ES6 Promise实现。实际上，很有可能你是在早期根本没有Promise实现的浏览器中使用由库提供的Promise
    - 因此，识别Promise（或者行为类似于Promise的东西）就是定义某种称为thenable的东西，将其定义为任何具有`then(..)`方法的对象和函数。我们认为，任何这样的值就是Promise一致的thenable
2.  根据一个值的形态（具有哪些属性）对这个值的类型做出一些假定。这种类型检查（typecheck）一般用术语鸭子类型（duck typing）来表示——“如果它看起来像只鸭子，叫起来像只鸭子，那它一定就是只鸭子”。于是，对thenable值的鸭子类型检测就大致类似于
    ```javascript
    if ( 
        p !== null && 
        ( 
            typeof p === "object" || 
            typeof p === "function" 
        ) && 
        typeof p.then === "function" 
    ) { 
        // 假定这是一个thenable! 
    } 
    else { 
        // 不是thenable 
    } 
    ```
    - 除了在多个地方实现这个逻辑有点丑陋之外，其实还有一些更深层次的麻烦
    - 如果你试图使用恰好有`then(..)`函数的一个对象或函数值完成一个Promise，但并不希望它被当作Promise或thenable，那就有点麻烦了，因为它会自动被识别为thenable，并被按照特定的规则处理。即使你并没有意识到这个值有`then(..)`函数也是这样
        ```javascript
        var o = { then: function(){} }; 
        // 让v [[Prototype]]-link到o 
        var v = Object.create( o ); 
        v.someStuff = "cool"; 
        v.otherStuff = "not so cool"; 
        v.hasOwnProperty( "then" ); // false 
        ```
        - v看起来根本不像Promise或thenable。它只是一个具有一些属性的简单对象，但你不知道的是，v还`[[Prototype]]`连接到了另外一个对象o，而后者恰好具有一个`then(..)`属性。所以thenable鸭子类型检测会把v认作一个thenable
    - 甚至不需要是直接有意支持的
        ```javascript
        Object.prototype.then = function(){}; 
        Array.prototype.then = function(){}; 
        var v1 = { hello: "world" }; 
        var v2 = [ "Hello", "World" ];
        ```
        - v1和v2都会被认作thenable。如果有任何其他代码无意或恶意地给`Object.prototype`、`Array.prototype`或任何其他原生原型添加`then(..)`，你无法控制也无法预测
        - 并且，如果指定的是不调用其参数作为回调的函数，那么如果有Promise决议到这样的值，就会永远挂住

### Promise信任问题
1.  Promise解决了所有因控制反转的信任问题
    - 由回调造成的信任问题
        - 调用回调过早
        - 调用回调过晚（或不被调用）
        - 调用回调次数过少或过多
        - 未能传递所需的环境和参数
        - 吞掉可能出现的错误和异常
2.  调用过早
    - 调用过早主要就是担心代码是否会引入类似Zalgo这样的副作用（一个任务有时同步完成，有时异步完成，这可能会导致竞态条件）
    - 根据定义，Promise就不必担心这种问题，因为即使是立即完成的Promise（类似于`new Promise(function(resolve){ resolve(42); })`）也无法被同步观察到。也就是说，对一个Promise调用`then(..)`的时候，即使这个Promise已经决议，提供给`then(..)`的回调也总会被异步调用。不再需要插入你自己的`setTimeout(..,0)`hack，Promise会自动防止Zalgo出现
3.  调用过晚
    - Promise创建对象调用`resolve(..)`或`reject(..)`时，这个Promise的`then(..)`注册的观察回调就会被自动调度。可以确信，这些被调度的回调在下一个异步事件点上一定会被触发。一个Promise决议后，这个Promise上所有的通过`then(..)`注册的回调都会在下一个异步时机点上依次被立即调用。这些回调中的任意一个都无法影响或延误对其他回调的调用
        ```javascript
        p.then( function(){ 
            p.then( function(){ 
                console.log( "C" ); 
            } ); 
            console.log( "A" ); 
        } ); 
        p.then( function(){ 
            console.log( "B" ); 
        } ); 
        // A B C 
        ```
        - 这里，"C"无法打断或抢占"B"，这是因为Promise的运作方式
    - 注意：两个独立Promise上链接的回调的相对顺序无法可靠预测，如果两个promise p1和p2都已经决议，那么`p1.then(..)`;`p2.then(..)`的调用顺序并不是想象的先调用p1的回调，然后是p2的回调
        ```javascript
        var p3 = new Promise( function(resolve,reject){ 
            resolve( "B" ); 
        } ); 
        var p1 = new Promise( function(resolve,reject){ 
            resolve( p3 ); 
        } ); 
        p2 = new Promise( function(resolve,reject){ 
            resolve( "A" ); 
        } ); 
        p1.then( function(v){ 
            console.log( v ); 
        } ); 
        p2.then( function(v){ 
            console.log( v ); 
        } ); 
        // A B <-- 而不是像你可能认为的B A 
        ```
        - 目前你可以看到，p1不是用立即值而是用另一个promise p3决议，后者本身决议为值"B"。规定的行为是把p3展开到p1，但是是异步地展开。所以，在异步任务队列中，p1的回调排在p2的回调之后
        - 要避免这样的细微区别带来的噩梦，你永远都不应该依赖于不同Promise间回调的顺序和调度



