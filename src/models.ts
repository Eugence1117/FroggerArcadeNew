import { BehaviorSubject, Observable } from "rxjs";
import * as Constant from "./constant";
import { Difficulty, Direction } from "./enums";
import { game } from "./main";
import { setElementAttributes } from "./utils";

export class Game{
    public lives:number = 5;
    public frog:Frog = new Frog(undefined);    
    public score:number = 0;
    public difficulty:Difficulty = Difficulty.Easy;
    public listener:BehaviorSubject<Game>;

    constructor(public terrains:Array<Terrain>,public movingObjs:Array<Array<MovingObject>>){
        this.listener = new BehaviorSubject<Game>(this);
    }

    fireEvent(){
        this.listener.next(this);
    }

    award(score:number){
        this.score += score;
        this.fireEvent()
    }

    announceDead(){                
        this.lives--;
        this.fireEvent()
        if(this.lives < 0){
            this.announceGameOver();
        }
        else{
            this.respawn();
        }
    }

    announceGameOver(){
        alert("You Lose. Good Luck Next Time !");
        this.restart();
    }

    restart(){
        this.lives = 5
        this.score = 0
        this.frog.reset();
        this.frog.updatePosition();
        this.fireEvent();
    }

    
    respawn(){
        this.frog.reset();
        this.frog.updatePosition();
    }
}

interface TerrainInterface{
    startX:number,
    endX:number,
    y:number, //row     
    isWalkable():boolean    
}

export class Terrain implements TerrainInterface{
    constructor(public startX:number, public endX:number, public y:number){

    }

    isWalkable():boolean{
        return true;
    }

    renderElement(svg: SVGElement) {
       return  
    }
}

export class River extends Terrain{
    public element?: Element | undefined;

    constructor(startX:number, endX:number, y:number){
        super(startX,endX,y);
    }

    renderElement(svg: SVGElement) {
        const water = document.createElementNS(svg.namespaceURI, "rect");
        setElementAttributes(water,{
            x: this.startX,
            y: this.y,
            width: this.endX - this.startX,
            height: Constant.BLOCK_SIZE,
            fill: "#95B3D7",
        })
        this.element = water;
        svg.appendChild(water);        
    }

    isWalkable(): boolean {
        return false;
    }
}

export class Ground extends Terrain{
    public element?: Element | undefined;

    constructor(startX:number, endX:number, y:number){
        super(startX,endX,y);
    }

    renderElement(svg: SVGElement){
        const ground = document.createElementNS(svg.namespaceURI, "rect");
        setElementAttributes(ground,{
            x: this.startX,
            y: this.y,
            width: this.endX - this.startX,
            height: Constant.BLOCK_SIZE,
            fill: "black",
        })
        svg.appendChild(ground);
        this.element = ground;        
    }

    isWalkable(): boolean {
        return true;
    }
}

export class SafeZone extends Terrain{
    public element?: Element | undefined;

    constructor(startX:number, endX:number, y:number){
        super(startX,endX,y);
    }

    renderElement(svg: SVGElement){
        const safeZone = document.createElementNS(svg.namespaceURI, "rect");
        setElementAttributes(safeZone,{
            x: this.startX,
            y: this.y,
            width: this.endX - this.startX,
            height: Constant.BLOCK_SIZE,
            fill: "#4B0082",                                        
        })
        svg.appendChild(safeZone);
        this.element = safeZone;        
    }

    isWalkable(): boolean {
        return true;
    }
}

export class Frog{
    public x:number;
    public y:number;
    public element?: Element | undefined;

    constructor(public ride?:object){
        this.x = (Math.floor(Constant.MAP_TOTAL_COLUMN / 2) * Constant.BLOCK_SIZE);
        this.y = (Constant.MAP_TOTAL_ROW - 1) * Constant.BLOCK_SIZE;
    }
    
    reset(){
        this.x = (Math.floor(Constant.MAP_TOTAL_COLUMN / 2) * Constant.BLOCK_SIZE);
        this.y = (Constant.MAP_TOTAL_ROW - 1) * Constant.BLOCK_SIZE;
        this.ride = undefined;
    }

    updatePosition(){
        this.element?.setAttribute("cx", (this.x + Constant.FROG_SIZE).toString());
        this.element?.setAttribute("cy", (this.y + Constant.FROG_SIZE).toString());
    }

    renderElement(svg:SVGElement){
        const frog = document.createElementNS(svg.namespaceURI, "circle");
        frog.setAttribute("r", Constant.FROG_SIZE.toString());        
        frog.setAttribute("cx", (this.x + Constant.FROG_SIZE).toString());
        frog.setAttribute("cy", (this.y + Constant.FROG_SIZE).toString());
        frog.setAttribute(
          "style",
          "fill: green; stroke: green; stroke-width: 1px;"
        );
        svg.appendChild(frog);
        this.element = frog;
    }
}

export class Position{
    constructor(public x:number,public y:number){

    }    
   
    isEqual(pos:Position){
        return this.x == pos.x && this.y == pos.y;
    }
}

export class MovingObject{
    public element?: Element | undefined;
    public isPassed:boolean = false;    

    constructor(public start:Position, public end:Position, public speed:number=0, public direction:Direction=Direction.Right){
    }

    initMovement(element:Element){
        if(this.speed > 0){          
            const speedIncremenet = game ? game.difficulty : Constant.DEFAULT_DIFFICULTY;            
            const observable = new Observable((subscriber) => {
                // const movement = (this.speed * tileSize)
                const moveEvent = setInterval(() => {                    
                    let diff = this.end.x - this.start.x
                    let newStart; 
                    let newEnd; 
                    if(this.direction == Direction.Right){
                        newStart = this.start.x + Constant.BLOCK_SIZE
                        newEnd = newStart + diff
                        // let newEnd = parseInt((this.endPosition.x + (this.endPosition.x * this.speed)).toFixed(0))                
                        if(newEnd >= Constant.MAP_SIZE_COL + this.end.x - this.start.x){
                            // clearInterval(moveEvent)
                            const size = this.end.x - this.start.x;
                            newStart = 0
                            newEnd = size;                        
                            
                            // this.isPassed = true    
                        
                            // subscriber.complete();              
                        }           
                        subscriber.next({
                            newStart,
                            newEnd
                        })
                    }     
                    else{
                        newEnd = this.end.x - Constant.BLOCK_SIZE;
                        newStart = newEnd - diff

                        // let newEnd = parseInt((this.endPosition.x + (this.endPosition.x * this.speed)).toFixed(0))                
                        if(newEnd <= 0){
                            // clearInterval(moveEvent)
                            const size = this.end.x - this.start.x;
                            newEnd = Constant.MAP_SIZE_COL
                            newStart = Constant.MAP_SIZE_COL - size;                                                            
                        }           
                        subscriber.next({
                            newStart,
                            newEnd
                        })
                    }              
                    // this.startPosition.x = newStart
                    // this.endPosition.x = newEnd                
                    // element.setAttribute("x",this.startPosition.x.toString());                
                    // console.log(newEnd);
                   
                },1000 / (this.speed + speedIncremenet ))
            })      
            
            const subscription = observable.subscribe({
                next: x => {                    
                    if(typeof x == "object"){
                        let payload = x as Record<string,number>   
                      
                        this.start = new Position(payload.newStart,this.start.y)
                        this.end = new Position(payload.newEnd,this.start.y)

                        element.setAttribute("x",this.start.x.toString());  
                        this.onMove();      
                    }
                },
                error:err => console.error(err),
                // complete:() => {      
                //     subscription.unsubscribe()   
                //     element.remove()           
                //     this.subject.next(this)                    
                // },
            })
        }        
    }

    isFrogHere(pos:Position):boolean{
        const startPos = this.start
        const endPos = this.end
        // console.log("Start",this.startPosition.toString(),"End",this.endPosition.toString(),"Frog",pos.toString())
        if(startPos.isEqual(endPos)){            
            return pos.x == startPos.x && pos.y == startPos.y
        }
        else{
            if(startPos.x == endPos.x){
                return pos.x == startPos.x && pos.y >= startPos.y && pos.y < endPos.y
            }
            else if(startPos.y == endPos.y){              
                return (pos.x >= startPos.x && pos.x < endPos.x && pos.y == startPos.y) //|| startPos.isEqual(pos) || endPos.isEqual(pos)
            }            
            return pos.x >= startPos.x && pos.x < endPos.x && pos.y >= startPos.y && pos.y < endPos.y;         
        }                   
    }

    onMove():void{
        if(this.isFrogHere(new Position(game.frog.x,game.frog.y))){
            game.announceDead();
        }
        return;
    }

    dieOnColide(){
        return true;
    }
    
    renderElement(svg:SVGElement){
        const obj = document.createElementNS(svg.namespaceURI, "rect");

        let width = this.end.x - this.start.x;
        width = width > 0 ? width : Constant.BLOCK_SIZE;
        let height = this.end.y - this.end.y;
        height = height > 0 ? height : Constant.BLOCK_SIZE;
                
        obj.setAttribute("x", `${this.start.x}`);
        obj.setAttribute("y", `${this.start.y}`); 
        obj.setAttribute("width", width.toString());
        obj.setAttribute("height", height.toString());        

        this.initMovement(obj);        
        svg.appendChild(obj);
        this.element = obj;            
    }
}

export class Wall extends MovingObject{
    private static SIZE:number = 1 * Constant.BLOCK_SIZE; //1 Block
    constructor(col:number,row:number,direction:Direction=Direction.Left){
        const yAxis = row * Constant.BLOCK_SIZE;
        const xAxis = col * Constant.BLOCK_SIZE;
        super(new Position(xAxis,yAxis),new Position(xAxis + Wall.SIZE,yAxis),0,direction);       
    }

    renderElement(svg: SVGElement): void {
        super.renderElement(svg);
        //Set style here
        this.element?.setAttribute("fill","red")        
    }
}

// Winning Tiles
export class Slot extends MovingObject{
    private static SIZE:number = 1 * Constant.BLOCK_SIZE;
    constructor(col:number,row:number,direction:Direction=Direction.Left){
        const yAxis = row * Constant.BLOCK_SIZE;
        const xAxis = col * Constant.BLOCK_SIZE;
        super(new Position(xAxis,yAxis),new Position(xAxis + Slot.SIZE,yAxis),0,direction);       
    }

    dieOnColide(): boolean {
        return false;
    }

    renderElement(svg: SVGElement): void {
        super.renderElement(svg);
        //Set style here
        this.element?.setAttribute("fill","green")        
    }
}

export class Log extends MovingObject{
    // For Best Experience, Size Between 2 - 4 Col
    constructor(col:number,row:number,size:number,speed:number,direction:Direction=Direction.Left){
        const yAxis = row * Constant.BLOCK_SIZE;
        const xAxis = col * Constant.BLOCK_SIZE;
        super(new Position(xAxis,yAxis),new Position((col + size) * Constant.BLOCK_SIZE,yAxis),speed,direction);       
    }

    dieOnColide(){
        return false;
    }

    onMove():void{
        if(game.frog.ride){
            if(game.frog.ride === this){
                if(this.direction == Direction.Right){
                    game.frog.x += Constant.BLOCK_SIZE                            
                }
                else{
                    game.frog.x -= Constant.BLOCK_SIZE   
                }
                game.frog.updatePosition();                                
            }
        }
    }

    renderElement(svg: SVGElement): void {
        super.renderElement(svg);
        //Set style here
        this.element?.setAttribute("fill","#654321")        
    }
}

export class Truck extends MovingObject{
    private static SIZE:number = 2 * Constant.BLOCK_SIZE; //2 Block Width
    constructor(col:number,row:number,speed:number,direction:Direction=Direction.Left){
        const yAxis = row * Constant.BLOCK_SIZE;
        const xAxis = col * Constant.BLOCK_SIZE;
        super(new Position(xAxis,yAxis),new Position(xAxis + Truck.SIZE,yAxis),speed,direction);       
    }

    renderElement(svg: SVGElement): void {
        super.renderElement(svg);
        //Set style here
        this.element?.setAttribute("fill","grey")        
    }
}

export class Car extends MovingObject{
    private static SIZE:number = 1 * Constant.BLOCK_SIZE;
    constructor(col:number,row:number,speed:number,direction:Direction=Direction.Left){
        const yAxis = row * Constant.BLOCK_SIZE;
        const xAxis = col * Constant.BLOCK_SIZE;
        super(new Position(xAxis,yAxis),new Position(xAxis + Car.SIZE,yAxis),speed,direction);       
    } 
    
    renderElement(svg: SVGElement): void {
        super.renderElement(svg);
        //Set style here
        this.element?.setAttribute("fill","gold")        
    }
}
