import "./style.css";
import { interval, fromEvent, merge, BehaviorSubject } from "rxjs";
import { map, filter, mergeMap, takeUntil, take } from "rxjs/operators";
import { Frog, Ground, River, SafeZone, Terrain, Game, MovingObject, Position, Truck, Car, Log, Wall, Slot} from "./models";
import { Direction } from "./enums";
import * as Constant from "./constant";


// type State = Readonly<{
//   score:number,
//   lives:number
// }>
export let game:Game;

function main() {
  /**
   * Inside this function you will use the classes and functions from rx.js
   * to add visuals to the svg element in pong.html, animate them, and make them interactive.
   *
   * Study and complete the tasks in observable examples first to get ideas.
   *
   * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
   *
   * You will be marked on your functional programming style
   * as well as the functionality that you implement.
   *
   * Document your code!
   */

  /**
   * This is the view for your game to add and update your game elements.
   */
  const svg = document.querySelector("#svgCanvas") as SVGElement & HTMLElement;
  svg.style.width = Constant.MAP_SIZE_ROW.toString();
  svg.style.height = Constant.MAP_SIZE_COL.toString();
   
  // Creating the terrain (Total 9 Row, 3 Safe Zone (Include Finish Line), 3 River, 3 Ground)
  const terrains = initMapTerrain(svg);

  // Creating some fixed moving object (Car, Truck, Log, and some static object such as wall in Finish Line)
  const movingObjs = initMovingObjects(svg);

  // Initiate Game Object
  game = new Game(terrains,movingObjs);
  initFrog(svg); // Create the Frog

 
// This function allows the frog to move (Each Click move one block)
function keyboardControl() {
  // keyboard controls for frog
  const key$ = fromEvent<KeyboardEvent>(document,"keydown"); 

  const moveLeft = key$.pipe(
    // take only left key
    filter(({key}) => key === 'ArrowLeft'),
    filter(({repeat}) => !repeat),
    // check for hold down button 
    // mergeMap(d => interval(10).pipe(
    //   takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    //     filter(({code}) => code === d.code)
    //   )),
    //   map(_=>d)
    // )),
    map(_=> ({
      x: -Constant.BLOCK_SIZE,
      y: 0
    }))
    );

  const moveRight = key$.pipe(
    // take only left key
    filter(({key}) => key === 'ArrowRight'),
    filter(({repeat}) => !repeat),
    // check for hold down button 
    // mergeMap(d => interval(10).pipe(
    //   takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    //     filter(({code}) => code === d.code)
    //   )),
    //   map(_=>d)
    // )),
    map(_=> {    
      return ({
        x: Constant.BLOCK_SIZE,
        y: 0
      })
    })    
    );

  const moveUp = key$.pipe(
    // take only left key
    filter(({key}) => key === 'ArrowUp'),
    filter(({repeat}) => !repeat),
    // check for hold down button 
    // mergeMap(d => interval(10).pipe(
    //   takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    //     filter(({code}) => code === d.code)
    //   )),
    //   map(_=>d)
    // )),
    map(_=> ({
      x: 0,
      y: -Constant.BLOCK_SIZE,
    }))
    );

  const moveDown = key$.pipe(
    // take only left key
    filter(({key}) => key === 'ArrowDown'),
    filter(({repeat}) => !repeat),
    // check for hold down button 
    // mergeMap(d => interval(10).pipe(
    //   takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    //     filter(({code}) => code === d.code)
    //   )),
    //   map(_=>d)
    // )),
    map(_=> ({
      x: 0,
      y: Constant.BLOCK_SIZE,
    }))
    );

  merge(moveLeft,moveRight,moveUp,moveDown).
    subscribe(({x,y}) => {          
      //Update Frog Position Every Move 
      // !!! Can Put Logics like maximum x and maximum y to avoid frog move out of map !!!
      game.frog.x += x;      
      game.frog.y += y; 
      game.frog.updatePosition()     

      //If no collision with object only check terrain
      if(!checkCollideObject(game.frog,movingObjs)){
        //Check whether any event when stepping on the terrain (Eg, River cause frog dead)
        checkCollideTerrain(game.frog,terrains);           
      }          
    });  

  
  }

function checkCollideObject(frog:Frog,movingObjects:Array<Array<MovingObject>>):boolean{
  const currentRow = frog.y / Constant.BLOCK_SIZE; //Frog move at a constant speed, so divide by block size can know which row frog is/
  const rowObjects = movingObjects[currentRow]; //Get the moving object from that row to check whether any collision happened

  let collidedObject = null;
  frog.ride = undefined; // Used to hold the rideable moving objects like Log or Turtle(If added)
  for(let item of rowObjects){
    if(item.isFrogHere(new Position(frog.x,frog.y))){
      collidedObject = item;
      break;
    }
  }

  if(collidedObject){
    //Check the Moving Object that collided will cause frog die or not
    if(collidedObject.dieOnColide()){
      game.announceDead();
    }
    else{
      // Update ride as Log is rideable
      if(collidedObject instanceof Log){
        frog.ride = collidedObject;
      }
      // Award score as Slot is served as a finish goal (Score given is based on the lives remaining)
      else if(collidedObject instanceof Slot){
        game.award(game.lives * 10);
        frog.reset()
        frog.updatePosition();
      }
    }
  }

  return collidedObject != null
}

// Check whether the standing terrain will cause frog dead or not
function checkCollideTerrain(frog:Frog,terrains:Array<Terrain>){
  const currentRow = frog.y / Constant.BLOCK_SIZE;  
  if(!terrains[currentRow].isWalkable()){
    game.announceDead();
  }
}
  
//Add Keyboard Control
keyboardControl();
}

function initMapTerrain(svg:SVGElement):Array<Terrain>{
  // Initialize Terrain (Must follow exactly the row index)
  // 0 is Top and etc.
  const map:Array<Terrain> = [
    new SafeZone(0,Constant.MAP_SIZE_ROW,0 * Constant.BLOCK_SIZE),    
    new River(0,Constant.MAP_SIZE_ROW,1 * Constant.BLOCK_SIZE),
    new River(0,Constant.MAP_SIZE_ROW,2 * Constant.BLOCK_SIZE),
    new River(0,Constant.MAP_SIZE_ROW,3 * Constant.BLOCK_SIZE),
    new SafeZone(0,Constant.MAP_SIZE_ROW,4 * Constant.BLOCK_SIZE),    
    new Ground(0,Constant.MAP_SIZE_ROW,5 * Constant.BLOCK_SIZE),
    new Ground(0,Constant.MAP_SIZE_ROW,6 * Constant.BLOCK_SIZE),
    new Ground(0,Constant.MAP_SIZE_ROW,7 * Constant.BLOCK_SIZE),
    new SafeZone(0,Constant.MAP_SIZE_ROW,8 * Constant.BLOCK_SIZE),    
  ]
  
  const elements = map.map((tile) => tile.renderElement(svg));  
  return map;
}

function initMovingObjects(svg:SVGElement):Array<Array<MovingObject>>{  
  // Two Layer of Array 
  // First Layer to indicate the row
  // Second Layer to indicate the Moving Object that exist on that row
  const movingObjs =  [    
    [      
      new Wall(0,0),
      new Slot(1,0),
      new Wall(2,0),
      new Slot(3,0),
      new Wall(4,0),
      new Slot(5,0),
      new Wall(6,0),
      new Slot(7,0),
      new Wall(8,0),
    ],
    [
      // Start Position, Row, Length of Log, Speed, Direction (Row and Speed must be same, Row must be same index)
      new Log(0,1,3,1,Direction.Right),
      new Log(6,1,2,1,Direction.Right),            
    ],
    [
      new Log(1,2,2,1.5,Direction.Left),
      new Log(6,2,2,1.5,Direction.Left),       
    ],
    [
      new Log(1,3,2,1.5,Direction.Right),
      new Log(5,3,2,1.5,Direction.Right), 
      new Log(8,3,2,1.5,Direction.Right),        
    ],
    [],
    [
      // Start Position, Row, Speed, Direction  (Row and Speed must be same, Row must be same index)
      new Truck(0,5,2,Direction.Left),
      new Truck(4,5,2,Direction.Left),
      // new Truck(7,5,2,Direction.Left),      
    ],
    [
      // Start Position, Row, Speed, Direction  (Row and Speed must be same, Row must be same index)
      new Car(2,6,1.5,Direction.Right),
      new Car(5,6,1.5,Direction.Right),      
      new Car(9,6,1.5,Direction.Right), 
    ],
    [
      new Car(0,7,1.5,Direction.Right),
      new Car(3,7,1.5,Direction.Right),      
      new Car(7,7,1.5,Direction.Right), 
      // new Car(9,7,1.5,Direction.Right), 
    ],
    []    
  ];
  // Render All Element Out
  movingObjs.forEach(row => {
    row.forEach((obj) => {
      obj.renderElement(svg);
    })
  })

  return movingObjs
}

function initFrog(svg:SVGElement):void{
  game.frog.renderElement(svg);
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    document.getElementById("status")!!.style.width = Constant.MAP_SIZE_ROW.toString();    
    main();
    game.listener.subscribe({
      next:(game) => {
        document.querySelector("#live > span")!!.innerHTML = game.lives.toString();
        document.querySelector("#score > span")!!.innerHTML = game.score.toString();
      }
    })
  };
}
