export function setElementAttributes(element:Element,obj:Object):Element{
    Object.entries(obj).forEach(([key, val]) => element.setAttribute(key, String(val)))    
    return element; 
}