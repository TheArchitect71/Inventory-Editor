import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';

import { Product } from './product';
import { PRODUCTS } from './mock-products';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private messageService: MessageService) { }

  getProducts(): Observable<Product[]> {
    this.messageService.add('ProductService: fetched products');
      return of(PRODUCTS);
  }
}
