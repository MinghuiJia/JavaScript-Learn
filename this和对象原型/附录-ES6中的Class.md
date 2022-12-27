<!--
 * @Author: jiaminghui
 * @Date: 2022-12-27 22:03:22
 * @LastEditTime: 2022-12-27 22:54:55
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\this和对象原型\附录-ES6中的class.md
 * @Description: 
-->
# ES6中的Class学习

## class相较于典型的原型风格代码解决的问题
```javascript
class Widget { 
 constructor(width,height) {
 this.width = width || 50; 
 this.height = height || 50; 
 this.$elem = null;
 }
 render($where){
 if (this.$elem) { 
 this.$elem.css( {
 width: this.width + "px",
 height: this.height + "px" 
 } ).appendTo( $where );
 } 
 }
}
class Button extends Widget { 
 constructor(width,height,label) {
 super( width, height );
 this.label = label || "Default";
 this.$elem = $( "<button>" ).text( this.label );
 }
 render($where) {
 super( $where );
 this.$elem.click( this.onClick.bind( this ) ); 
 }
 onClick(evt) {
 console.log( "Button '" + this.label + "' clicked!" );
 } 
}
```
1.  class语法更好看
2.  Button声明时直接“继承”了Widget，不再需要通过`Object.create(..)`来替换`.prototype`对象，也不需要设置`.__proto__`或者`Object.setPrototypeOf(..)`
3.  可以通过`super(..)`来实现相对多态
4.  class字面语法不能声明属性（只能声明方法）可以帮助你避免犯错（原型链末端的“实例”可能会意外地获取其他地方的属性）
5.  可以通过extends很自然地扩展对象（子）类型，甚至是内置的对象（子）类型，比如`Array`或`RegExp`

## class陷阱
1.  class基本上只是现有`[[Prototype]]`（委托！）机制的一种语法糖，class并不会像传统面向类的语言一样在声明时静态复制所有行为。如果你修改或者替换了父“类”中的一个方法，那子“类”和所有实例都会受到影响，因为它们在定义时并没有进行复制，只是使用基于`[[Prototype]]`的实时委托
    ```javascript
    class C { 
        constructor() {
            this.num = Math.random(); 
        }
        rand() {
            console.log( "Random: " + this.num );
        } 
    }
    var c1 = new C();
    c1.rand(); // "Random: 0.4324299..."
    C.prototype.rand = function() {
        console.log( "Random: " + Math.round( this.num * 1000 ));
    };
    var c2 = new C();
    c2.rand(); // "Random: 867"
    c1.rand(); // "Random: 432" ——噢！
    ```
2.  class语法无法定义类成员属性（只能定义方法），如果为了跟踪实例之间共享状态必须要这么做，那你只能使用丑陋的`.prototype`语法
    ```javascript
    class C { 
        constructor() {
            // 确保修改的是共享状态而不是在实例上创建一个屏蔽属性！
            C.prototype.count++;
            // this.count 可以通过委托实现我们想要的功能
            console.log( "Hello: " + this.count );
        }
    }
    // 直接向 prototype 对象上添加一个共享状态
    C.prototype.count = 0;
    var c1 = new C(); 
    // Hello: 1
    var c2 = new C(); 
    // Hello: 2
    c1.count === 2; // true 
    c1.count === c2.count; // true
    ```
    - 上述代码虽然解决了共享状态问题，但是违背了class语法的本意，在实现中暴露（泄露！）了`.prototype`
3.  class语法仍然面临意外屏蔽的问题
    ```javascript
    class C { 
        constructor(id) {
            // 噢，郁闷，我们的 id 属性屏蔽了 id() 方法
            this.id = id;
        }
        id() {
        console.log( "Id: " + id );
        }
    } 
    var c1 = new C( "c1" );
    c1.id(); // TypeError -- c1.id 现在是字符串 "c1"
    ```
4.  出于性能考虑（this绑定已经是很大的开销了），super并不是动态绑定的，它会在声明时“静态”绑定。而不是super总会绑定到链中的上一层
    ```javascript
    class P {
        foo() { console.log( "P.foo" ); }
    }
    class C extends P { 
        foo() {
            super(); 
        }
    }
    var c1 = new C();
    c1.foo(); // "P.foo"
    var D = {
        foo: function() { console.log( "D.foo" ); }
    };
    var E = {
        foo: C.prototype.foo
    };
    // 把 E 委托到 D
    Object.setPrototypeOf( E, D ); 
    E.foo(); // "P.foo"
    ```
    - 如果你认为super会动态绑定，那你可能期望`super()`会自动识别出E委托了D，所以`E.foo()`中的`super()`应该调用`D.foo()`
    - super并不像this一样是晚绑定（动态绑定），它在`[[HomeObject]].[[Prototype]]`上，`[[HomeObject]]`会在创建时静态绑定
    - 上述代码中`super()`会调用`P.foo()`，因为方法的`[[HomeObject]]`仍然是C（`C.prototype.foo`这是静态绑定好的关系），`C.[[Prototype]]`是P
    - 解决办法就是使用`toMethod(..)`绑定手动修改super绑定
        ```javascript
        var D = {
            foo: function() { console.log( "D.foo" ); }
        };
        // 把 E 委托到 D
        var E = Object.create( D );
        // 手动把 foo 的 [[HomeObject]] 绑定到 E，E.[[Prototype]] 是 D，所以 super() 是 D.foo()
        E.foo = C.prototype.foo.toMethod( E, "foo" );
        E.foo(); // "D.foo"
        ```
        - `toMethod(..)`会复制方法并把homeObject当作第一个参数（也就是我们传入的E），第二个参数（可选）是新方法的名称（默认是原方法名）
5.  ES6中的class会让你误以为定义了一个class后，它就变成了一个（未来会被实例化的）东西的静态定义，但实际上他是一个个具体的可以直接交互的对象（这样我们就可以在定义好class之后再通过`.prototype`修改定义的方法）。注意class似乎不赞成动态修改，所以强制让你使用丑陋的`.prototype`语法以及super问题，class本质上希望告诉我们**动态太难实现了，所以这可能不是个好主意，所以编写静态代码吧**
6.  使用`.bind(..)`函数来硬绑定函数，那么这个函数不会像普通函数那样被ES6的extend扩展到子类中
    
