(function() {
module('can/observe')

test("Basic Observe",9,function(){
	
	var state = new can.Observe({
		category : 5,
		productType : 4,
		properties : {
		  brand: [],
		  model : [],
		  price : []
		}
	});
	
	var added;
	
	state.bind("change", function(ev, attr, how, val, old){
		equals(attr, "properties.brand.0", "correct change name")
		equals(how, "add")
		equals(val[0].attr("foo"),"bar", "correct")
		
		added = val[0];
	});
	
	
	
	state.attr("properties.brand").push({foo: "bar"});
	
	state.unbind("change");
	
	added.bind("change", function(ev, attr, how, val, old){
		equals(attr, "foo","foo property set on added")
		equals(how, "set","added")
		equals(val, "zoo","added")
	})
	state.bind("change", function(ev, attr, how, val, old){
		equals(attr, "properties.brand.0.foo")
		equals(how, "set")
		equals(val,"zoo")
	});
	added.attr("foo", "zoo");
	
});

test("list attr changes length", function(){
	var l = new can.Observe.List([0,1,2])
	l.attr(3,3)
	equals(l.length, 4);
})

test("list splice", function(){
	var l = new can.Observe.List([0,1,2,3]),
		first = true;
  
	l.bind('change', function( ev, attr, how, newVals, oldVals ) { 
		equals (attr, "1")
		// where comes from the attr ...
		//equals(where, 1)
		if(first){
			equals( how, "remove", "removing items" )
			equals( newVals, undefined, "no new Vals" )
		} else {
			same( newVals, ["a","b"] , "got the right newVals")
			equals( how, "add", "adding items" )
		}
	
		first = false;
	})
	
	l.splice(1,2, "a", "b"); 
	same(l.serialize(), [0,"a","b", 3], "serialized")
});



test("list pop", function(){
	var l = new can.Observe.List([0,1,2,3]);
  
	l.bind('change', function( ev, attr, how, newVals, oldVals ) { 
		equals (attr, "3")
		
		equals( how, "remove" )
		equals( newVals, undefined )
		same( oldVals, [3] )
	})
	
	l.pop(); 
	same(l.serialize(), [0,1,2])
})

test("changing an object unbinds", function(){
	var state = new can.Observe({
		category : 5,
		productType : 4,
		properties : {
		  brand: [],
		  model : [],
		  price : []
		}
	}),
	count = 0;
	
	var  brand = state.attr("properties.brand");
	
	state.bind("change", function(ev, attr, how, val, old){
		equals(attr,"properties.brand");
		
		equals(count, 0, "count called once");
		count++;
		equals(how, "set")
		equals(val[0], "hi")
	});
	state.attr("properties.brand",["hi"]);
	
	brand.push(1,2,3);
	
});

test("replacing with an object that object becomes observable",function(){
	var state = new can.Observe({
		properties : {
		  brand: [],
		  model : [],
		  price : []
		}
	});
	
	ok(state.attr("properties").bind, "has bind function");
	
	state.attr("properties",{});
	
	ok(state.attr("properties").bind, "has bind function");
});

test("attr does not blow away old observable", function(){
	var state = new can.Observe({
		properties : {
			brand: ['gain']
		}
	});
	var oldCid = state.attr("properties.brand")._cid;
	state.attr({properties:{brand:[]}}, true);
	same(state.attr("properties.brand")._cid, oldCid, "should be the same observe, so that views bound to the old one get updates")
	equals(state.attr("properties.brand").length, 0, "list should be empty");
});

test("sub observes respect attr remove parameter", function() {
    var bindCalled = 0,
        state = new can.Observe({
        monkey : {
            tail: 'brain'
        }
    });

    state.bind("change", function(ev, attr, how, newVal, old){
        bindCalled++;
        equals(attr, "monkey.tail");
        equals(old, "brain");
        equals(how, "remove");
    });

    state.attr({monkey: {}});
    equals("brain", state.attr("monkey.tail"), "should not remove attribute of sub observe when remove param is false");
    equals(0, bindCalled, "remove event not fired for sub observe when remove param is false");

    state.attr({monkey: {}}, true);

    equals(undefined, state.attr("monkey.tail"), "should remove attribute of sub observe when remove param is false");
    equals(1, bindCalled, "remove event fired for sub observe when remove param is false");
});

test("remove attr", function(){
	var state = new can.Observe({
		properties : {
		  brand: [],
		  model : [],
		  price : []
		}
	});
	
	state.bind("change", function(ev, attr, how, newVal, old){
		equals(attr, "properties");
		equals(how, "remove")
		same(old.serialize() ,{
		  brand: [],
		  model : [],
		  price : []
		} );
	})
	
	state.removeAttr("properties");
	equals(undefined,  state.attr("properties") );
});

test("remove nested attr", function(){
	var state = new can.Observe({
		properties : {
			nested: true
		}
	});
	
	state.bind("change", function(ev, attr, how, newVal, old){
		equals(attr, "properties.nested");
		equals(how, "remove")
		same(old , true);
	})
	
	state.removeAttr("properties.nested");
	equals(undefined,  state.attr("properties.nested") );
});

test("remove item in nested array", function(){
	var state = new can.Observe({
		array : ["a", "b"]
	});
	
	state.bind("change", function(ev, attr, how, newVal, old){
		equals(attr, "array.1");
		equals(how, "remove")
		same(old, ["b"]);
	})
	
	state.removeAttr("array.1");
	equals(undefined,  state.attr("array.1") );
});

test("remove nested property in item of array", function(){
	var state = new can.Observe({
		array : [{
			nested: true
		}]
	});
	
	state.bind("change", function(ev, attr, how, newVal, old){
		equals(attr, "array.0.nested");
		equals(how, "remove")
		same(old, true);
	})
	
	state.removeAttr("array.0.nested");
	equals(undefined,  state.attr("array.0.nested") );
});

test("remove nested property in item of array observe", function(){
	var state = new can.Observe.List([{nested: true}]);
	
	state.bind("change", function(ev, attr, how, newVal, old){
		equals(attr, "0.nested");
		equals(how, "remove")
		same(old, true);
	})
	
	state.removeAttr("0.nested");
	equals(undefined,  state.attr("0.nested") );
});

test("attr with an object", function(){
	var state = new can.Observe({
		properties : {
		  foo: "bar",
		  brand: []
		}
	});
	
	state.bind("change", function(ev, attr, how, newVal){
		equals(attr, "properties.foo")
		equals(newVal, "bad")
	})
	
	state.attr({
		properties : {
		  foo: "bar",
		  brand: []
		}
	})
	
	state.attr({
		properties : {
		  foo: "bad",
		  brand: []
		}
	});
	
	state.unbind("change");
	
	state.bind("change", function(ev, attr, how, newVal){
		equals(attr, "properties.brand.0")
		equals(how,"add")
		same(newVal, ["bad"])
	});
	
	state.attr({
		properties : {
		  foo: "bad",
		  brand: ["bad"]
		}
	});
	
});

test("empty get", function(){
	var state = new can.Observe({});
	
	equals(state.attr('foo.bar'), undefined)
});

test("attr deep array ", function(){
	var state = new can.Observe({});
	var arr = [{
			foo: "bar"
		}],
		thing = {
			arr: arr
		};
	
	state.attr({
		thing: thing
	}, true);
	
	ok(thing.arr === arr, "thing unmolested");
});

test('attr semi-serialize', function(){
	var first = {
			foo : {bar: 'car'},
			arr: [1,2,3, {four: '5'}]
		},
		compare = {
			foo : {bar: 'car'},
			arr: [1,2,3, {four: '5'}]
		};
	
	var res = new can.Observe(first).attr();
	same(res,compare, "test")
})
	
test("attr sends events after it is done", function(){
	var state = new can.Observe({foo: 1, bar: 2})
	state.bind('change', function(){
		equals(state.attr('foo'), -1, "foo set");
		equals(state.attr('bar'), -2, "bar set")
	})
	state.attr({foo: -1, bar: -2});
})

test("direct property access", function(){
	var state = new can.Observe({foo: 1, attr: 2});
	equals(state.foo,1);
	equals(typeof state.attr, 'function')
})

test("pop unbinds", function(){
	var l = new can.Observe.List([{foo: 'bar'}]);
	var o = l.attr(0),
		count = 0;
	l.bind('change', function(ev, attr, how, newVal, oldVal){
		count++;
		if(count == 1){
			// the prop change
			equals(attr, '0.foo', "count is set");
		} else if(count === 2 ){
			equals(how, "remove");
			equals(attr, "0")
		} else {
			ok(false, "called too many times")
		}
		
	})
	
	equals( o.attr('foo') , 'bar');
	
	o.attr('foo','car')
	l.pop();
	o.attr('foo','bad')
})

test("splice unbinds", function(){
	var l = new can.Observe.List([{foo: 'bar'}]);
	var o = l.attr(0),
		count = 0;
	l.bind('change', function(ev, attr, how, newVal, oldVal){
		count++;
		if(count == 1){
			// the prop change
			equals(attr, '0.foo', "count is set");
		} else if(count === 2 ){
			equals(how, "remove");
			equals(attr, "0")
		} else {
			ok(false, "called too many times")
		}
		
	})
	
	equals( o.attr('foo') , 'bar');
	
	o.attr('foo','car')
	l.splice(0,1);
	o.attr('foo','bad')
});


test("always gets right attr even after moving array items", function(){
	var l = new can.Observe.List([{foo: 'bar'}]);
	var o = l.attr(0);
	l.unshift("A new Value")
	
	
	l.bind('change', function(ev, attr, how){
		equals(attr, "1.foo")
	})
	
	
	o.attr('foo','led you')
})
 
test("recursive observers do not cause stack overflow", function() {
	var a = new can.Observe();
	var b = new can.Observe({a: a});
	a.attr("b", b);

});

test("bind to specific attribute changes when an existing attribute's value is changed", function() {
	var paginate = new can.Observe( { offset: 100, limit: 100, count: 2000 } );
	paginate.bind( 'offset', function( ev, newVal, oldVal ) {
		equals(newVal, 200);
		equals(oldVal, 100);
	});
	paginate.attr( 'offset', 200 );
});
test("bind to specific attribute changes when an attribute is removed", 2, function() {
	var paginate = new can.Observe( { offset: 100, limit: 100, count: 2000 } );
	paginate.bind( 'offset', function( ev, newVal, oldVal ) {
		equals(newVal, undefined);
		equals(oldVal, 100);
	});
	paginate.removeAttr( 'offset' );
});

test("Array accessor methods", 11, function() {
	var l = new can.Observe.List([ 'a', 'b', 'c' ]),
		sliced = l.slice(2),
		joined = l.join(' | '),
		concatenated = l.concat([ 2, 1 ], new can.Observe.List([ 0 ]));

	ok(sliced instanceof can.Observe.List, 'Slice is an Observable list');
	equal(sliced.length, 1, 'Sliced off two elements');
	equal(sliced[0], 'c', 'Single element as expected');
	equal(joined, 'a | b | c', 'Joined list properly');
	ok(concatenated instanceof can.Observe.List, 'Concatenated is an Observable list');
	deepEqual(concatenated.serialize(), [ 'a', 'b', 'c', 2, 1, 0 ], 'List concatenated properly');
	l.forEach(function(letter, index) {
		ok(true, 'Iteration');
		if(index === 0) {
			equal(letter, 'a', 'First letter right');
		}
		if(index === 2) {
			equal(letter, 'c', 'Last letter right');
		}
	});
});

test("instantiating can.Observe.List of correct type", function() {
	var Ob = can.Observe({
		getName : function() {
			return this.attr('name');
		}
	});

	var list = new Ob.List([{
		name : 'Tester'
	}]);

	equal(list.length, 1, 'List length is correct');
	ok(list[0] instanceof can.Observe, 'Initialized list item converted to can.Observe');
	ok(list[0] instanceof Ob, 'Initialized list item converted to Ob');
	equal(list[0].getName(), 'Tester', 'Converted to extended Observe instance, could call getName()');
	list.push({
		name : 'Another test'
	});
	equal(list[1].getName(), 'Another test', 'Pushed item gets converted as well');
});

test("can.Observe.List.prototype.splice converts objects (#253)", function() {
	var Ob = can.Observe({
		getAge : function() {
			return this.attr('age') + 10;
		}
	});

	var list = new Ob.List([ {
		name: 'Tester',
		age: 23
	}, {
		name: 'Tester 2',
		age: 44
	}]);

	equal(list[0].getAge(), 33, 'Converted age');

	list.splice(1, 1, {
		name: 'Spliced',
		age: 92
	});

	equal(list[1].getAge(), 102, 'Converted age of spliced');
});

test("removing an already missing attribute does not cause an event", function(){
	var ob = new can.Observe();
	ob.bind("change", function(){
		ok(false)
	})
	ob.removeAttr("foo")
});

test("Only plain objects should be converted to Observes", function() {
	var ob = new can.Observe();
	ob.attr('date', new Date());
	ok(ob.attr('date') instanceof Date, 'Date should not be converted');

	var selected = can.$('body');
	ob.attr('sel', selected);
	if(can.isArray(selected)) {
		ok(ob.attr('sel')  instanceof can.Observe.List, 'can.$() as array converted into Observe.List');
	} else {
		equal(ob.attr('sel'), selected, 'can.$() should not be converted');
	}

	ob.attr('element', document.getElementsByTagName('body')[0]);
	equal(ob.attr('element'), document.getElementsByTagName('body')[0], 'HTMLElement should not be converted');

	ob.attr('window', window);
	equal(ob.attr('window'), window, 'Window object should not be converted');
});

test("bind on deep properties",function(){
	expect(2)
	var ob = new can.Observe({name: {first: "Brian"}});
	ob.bind("name.first",function(ev, newVal, oldVal){
		equal(newVal,"Justin");
		equal(oldVal,"Brian")
	});
	
	ob.attr('name.first',"Justin")
	
});

test("startBatch and stopBatch and changed event", 5, function(){
	
	var ob = new can.Observe({name: {first: "Brian"}, age: 29}),
		bothSet = false,
		changeCallCount = 0,
		changedCalled = false;
	
	
	ob.bind("change", function(){
		ok(bothSet, "both properties are set before the changed event was called")
		ok(!changedCalled, "changed not called yet")
		changeCallCount++;
	})
	// The following tests how changed events should fire
	/*ob.bind("changed", function(ev, attrs){
		equal(changeCallCount, 2, "two change events")
		
		equal(attrs.length, 2, "changed events include bubbling change events");
		changedCalled = true;
	})*/
	stop();
	can.Observe.startBatch(function(){
		ok(true, "batch callback called")
	});
	
	ob.attr('name.first','Justin')
	setTimeout(function(){
		ob.attr('age',30);
		bothSet = true;
		can.Observe.stopBatch();
		start();
	},1)
	
	
	
});

test("startBatch callback", 4, function(){
	
	var ob = new can.Observe({
			game: {
				name: "Legend of Zelda"
			}, 
			hearts: 15
		}),
		callbackCalled = false;
	
	ob.bind("change", function(){
		equals(callbackCalled, false, 'startBatch callback not called yet');
	});

	can.Observe.startBatch(function(){
		ok(true, "startBatch callback called");
		callbackCalled = true;
	});
	
	ob.attr('hearts', 16);
	equals(callbackCalled, false, 'startBatch callback not called yet');
	can.Observe.stopBatch();
	equals(callbackCalled, true, 'startBatch callback called');
});

test("nested observe attr", function() {
	var person1 = new can.Observe( { name: {first: 'Josh' } } ),
		person2 = new can.Observe( { name: {first: 'Justin', last: 'Meyer' } } ),
		count = 0;

	person1.bind("change", function(ev, attr, how, val, old){
		equals(count, 0, 'change called once')
		count++;
		equals(attr, 'name');
		equals(val.attr('first'), 'Justin');
		equals(val.attr('last'), 'Meyer');
	})

	person1.attr('name', person2.attr('name'));

	// Attempt to set the name attribute again, should not
	// cause any triggers.
	person1.attr('name', person2.attr('name'));
});

test("Nested array conversion (#172)", 4, function() {
	var original = [ [1, 2], [3, 4], [5, 6] ],
		list = new can.Observe.List(original);

	equal(list.length, 3, 'Observe list length is correct');
	deepEqual(list.serialize(), original, 'Lists are the same');
	list.unshift([10, 11], [12, 13]);
	ok(list[0] instanceof can.Observe.List, 'Unshifted array converted to observe list');

	deepEqual(list.serialize(), [[10, 11], [12, 13]].concat(original), 'Arrays unshifted properly');
});

test("can.Observe.List.prototype.replace (#194)", 7, function() {
	var list = new can.Observe.List(['a', 'b', 'c']),
		replaceList = ['d', 'e', 'f', 'g'],
		dfd = new can.Deferred();

	list.bind('remove', function(ev, arr) {
		equal(arr.length, 3, 'Three elements removed');
	});

	list.bind('add', function(ev, arr) {
		equal(arr.length, 4, 'Four new elements added');
	});

	list.replace(replaceList);

	deepEqual(list.serialize(), replaceList, 'Lists are the same');

	list.unbind('remove');
	list.unbind('add');

	list.replace();
	equal(list.length, 0, 'List has been emptied');
	list.push('D');

	stop();
	list.replace(dfd);
	setTimeout(function() {
		var newList = ['x', 'y'];

		list.bind('remove', function(ev, arr) {
			equal(arr.length, 1, 'One element removed');
		});

		list.bind('add', function(ev, arr) {
			equal(arr.length, 2, 'Two new elements added from Deferred');
		});

		dfd.resolve(newList);

		deepEqual(list.serialize(), newList, 'Lists are the same');

		start();
	}, 100);
});

test("replace with a deferred that resolves to an Observe.List", function(){
	stop();
	
	var def = new can.Deferred();
	def.resolve(new can.Observe.List([{name: "foo"},{name: "bar"}]));
	var list = new can.Observe.List([{name: "1"},{name: "2"}]);
	list.bind("change",function(){
		start();
		
		equal(list.length, 2, "length is still 2");
		equal(list[0].attr("name"),"foo", "set to foo")
	})
	list.replace(def);
});

test(".attr method doesn't merge nested objects (#207)", function() {
	// From http://jsfiddle.net/andrewborovin/wsNZB/
	var test = new can.Observe({
		a: {
			a1: 1,
			a2: 2
		},
		b: {
			b1: 1,
			b2: 2
		}
	});

	test.attr({
		a: {
			a2: 3
		},
		b: {
			b1: 3
		}
	});

	deepEqual(test.attr(), {"a":{"a1":1,"a2":3},"b":{"b1":3,"b2":2}}, "Object merged as expected");
});

test("IE8 error on list setup with Observe.List (#226)", function() {
	var list = new can.Observe.List(['first', 'second', 'third']),
		otherList = new can.Observe.List(list);

	deepEqual(list.attr(), otherList.attr(), 'Lists are the same');
});

test("initialize Observe.List with a deferred",function(){
	stop()
	var def = new can.Deferred();
	var list = new can.Observe.List(def);
	list.bind("add",function(ev, items, index){
		same(items,["a","b"]);
		equal(index, 0);
		start();
	});
	setTimeout(function(){
		def.resolve(["a","b"])
	},10)
});

test("triggering a event while in a batch (#291)", function(){
	// normally a change event will not be triggered just
	// by changing properties. 
	// however, model does this in  destroyed
	// so a "change","destroyed" event bubbles.
	// this test errors if things are broken
	stop();
	var observe = new can.Observe();
	
	can.Observe.startBatch();
	can.trigger(observe, "change","random")
	
	setTimeout(function(){
		can.Observe.stopBatch();
		start()
	},10);
	
});

test("dot separated keys (#257, #296)", function() {
	var ob = new can.Observe({
		'test.value': 'testing',
		other: {
			test: 'value'
		}
	});
	equal(ob['test.value'], 'testing', 'Set value with dot separated key properly');
	equal(ob.attr('test.value'), 'testing', 'Could retrieve value with .attr');
	equal(ob.attr('other.test'), 'value', 'Still getting dot separated value');

	ob.attr({
		'other.bla': 'othervalue'
	});
	equal(ob['other.bla'], 'othervalue', 'Key is not split');
	equal(ob.attr('other.bla'), 'othervalue', 'Could retrieve value with .attr');

	ob.attr('other.stuff', 'thinger');
	equal(ob.attr('other.stuff'), 'thinger', 'Set dot separated value');
	deepEqual(ob.attr('other').serialize(), { test: 'value', stuff: 'thinger' }, 'Object set properly');
});

})();
