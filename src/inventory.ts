import {Component,ViewChild,ElementRef} from '@angular/core';import {CommonModule} from '@angular/common';import {FormsModule} from '@angular/forms';
import {filterItems,getSummary,isLowStock,loadItems,normalizeItem,saveItems} from './inventory-model.js';
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./inventory.html'})
export class Inventory{
 @ViewChild('dialog')dialog!:ElementRef<HTMLDialogElement>;
 items:any[]=loadItems();query='';stockFilter='all';editingId:string|null=null;error='';announcement='';form:any={};low=isLowStock;
 get summary(){return getSummary(this.items)}get visible(){return filterItems(this.items,this.query,this.stockFilter).sort((a:any,b:any)=>a.name.localeCompare(b.name))}
 openForm(item:any=null){this.editingId=item?.id??null;this.form=item?{...item}:{name:'',sku:'',category:'',quantity:0,reorderLevel:5,unitPrice:0};this.error='';this.dialog.nativeElement.showModal();setTimeout(()=>this.dialog.nativeElement.querySelector<HTMLInputElement>('[name=name]')?.focus());}
 close(){this.dialog.nativeElement.close()}
 persist(next:any[],message:string){try{saveItems(next);this.items=next;this.announcement=message;return true}catch{this.error='Could not save in this browser. Check that local storage is available.';if(!this.dialog.nativeElement.open)alert(this.error);return false}}
 save(){try{const item=normalizeItem(this.form,this.editingId??undefined);if(this.items.some(other=>other.sku.toLocaleLowerCase()===item.sku.toLocaleLowerCase()&&other.id!==item.id))throw new Error('That SKU is already in use.');const next=this.editingId?this.items.map(other=>other.id===this.editingId?item:other):[...this.items,item];if(this.persist(next,this.editingId?item.name+' updated.':item.name+' added.'))this.close()}catch(e){this.error=(e as Error).message}}
 deleteItem(item:any){if(confirm('Delete “'+item.name+'” from inventory?'))this.persist(this.items.filter(x=>x.id!==item.id),item.name+' deleted.')}
 exportItems(){const url=URL.createObjectURL(new Blob([JSON.stringify(this.items,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='inventory-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.announcement='Inventory exported.'}
}
