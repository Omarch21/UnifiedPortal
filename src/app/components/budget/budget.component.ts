import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';

import {ApexChart, ApexNonAxisChartSeries,ApexDataLabels, ApexTitleSubtitle,ApexOptions,ApexAnnotations,ApexPlotOptions } from 'ng-apexcharts';	
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable,tap,map,switchMap } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';
import { Expenditure } from 'src/app/models/expenditure.model';
import { ApexGrid,ColumnConfiguration } from 'apex-grid';
import { html,LitElement } from "lit";
import { MatDialog,MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EditExpenditureComponent } from '../edit-expenditure/edit-expenditure.component';
import { Routes } from '@angular/router';
import { ExpendituresComponent } from '../expenditures/expenditures.component';





ApexGrid.register();
interface GroupedExpenditures {
  [key: string]: number;
}
@UntilDestroy()

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
})

export class BudgetComponent implements OnInit {

 column: ColumnConfiguration<Expenditure>[] = [
   { key: 'Type', type: 'string', sort: {comparer: (a, b) => a.length - b.length },filter: true,width: '20%'},
   { key: 'Amount', type: 'number', sort: true,filter: true,width: '20%'},
   { key: 'Date', type: 'string', sort: true,filter: true,width: '20%'},
   { key: 'Notes', type: 'string',  sort: true,filter: true,width: '20%'},
   { key: 'id', headerText: "edit", cellTemplate: ({ value,row }) => html` <button style="background-color: purple; color: #fff; border: none; border-radius: 4px; padding: 8px 12px; font-size: 12px;"
   @click="${() => this.editExpenditure(value)}">Edit</button> <style> button:active{transform: translateY(2px);};`, width: '20%'},
 ];
  user$ = this.usersService.currentUserProfile$;
  expen$ = this.usersService.getExpenditures();
  expenditures: Expenditure[] = [];
  values: number[] = [];
  textlabels: string[] = [];
  gridExpenditure: Expenditure[] = [];
  
  constructor(private usersService: UsersService, private firestore: Firestore, private auth: AuthService, private router: Router,private dialog: MatDialog) {

  }
  chartOptions2: ApexOptions = {
  }
  ngOnInit() {
    this.user$
      .pipe(
        switchMap((totalBudget) => {
          return this.usersService.getExpenditures().pipe(
            tap((expenditures) => {
              if (expenditures) {
                this.expenditures = expenditures;
                console.log(expenditures.map((expenditure) => expenditure.Amount));
                const sorted = expenditures.map((expenditure) => expenditure.Date).sort((a,b)=> new Date(a!).getTime() - new Date(b!).getTime())
                const somedata =  expenditures.map((expenditure) => ({
                  name:expenditure.Type,
                  data: sorted.map((date,index) =>{
                    if(date ===expenditure.Date){
                      return expenditure.Amount
                    }else{
                      return null;
                    }
                  })
                }));
                
                
                this.chartOptions2 = {
                  chart: {
                    type: 'bar',
                    stacked: true
                  },
                  xaxis:{
                    type: 'datetime',
                    categories:   sorted
                    
                  },
                series: somedata
                
              }
            
              
                const groupedExpenditures = expenditures.reduce((accumulator: GroupedExpenditures, currentValue) => {
                  if (accumulator[currentValue.Type]) {
                    accumulator[currentValue.Type] += currentValue.Amount;
                  } else {
                    accumulator[currentValue.Type] = currentValue.Amount;
                  }
                  return accumulator;
                }, {});
               
                this.values = Object.values(groupedExpenditures);
                this.textlabels = Object.keys(groupedExpenditures);
                //this.chartPlot.pie!.donut!.labels!.total!.formatter! = `Total: $${this.values.reduce((a, b) => a + b, 0)}`;
              } else {
                console.log('No expenditures found.');
              }
            }),
            map((expenditures) => {
              return {
                values: this.values,
                textLabels: this.textlabels
              }
            })
          );
        }),
        untilDestroyed(this)
      )
      .subscribe((chartSeries) => {
        this.chartSeries = chartSeries.values;
        this.chartLabels = chartSeries.textLabels;
      });
  }

  chartSeries: ApexNonAxisChartSeries = [];
  chartDetails: ApexChart = {
    type: 'donut',
    toolbar: {
      show: true,
    },
  };
  chartOptions: ApexDataLabels = {
      enabled: true,
      formatter: function (val, opts) {
        return  `$${opts.w.config.series[opts.seriesIndex]}`;
        
      },
      
      
  
}

public chartPlot: ApexPlotOptions = {
  pie: {
    donut: {
      labels: {
        show: true,
        total:{
          show: true,
          showAlways: true,
          fontSize: "24px",
          color: "purple",
          label: "Total Expenditures",
          formatter: function (w) {
            const sum = w.globals.seriesTotals.reduce((a: number, b: number) => {
              return a + b;
            }, 0);
            return `$${sum}`;
          }
        },
        value:{
          show: true,
          color: "purple",
        }
      }
    }
  }

};

//editExpenditure(expenditure: Expenditure) {
  //const dialogRef = this.dialog.open(EditExpenditureComponent, {
 //   width: '500px',
   // data: expenditure
 // });

 
//}
//products: Expenditure[] = [];

editExpenditure(id: string) {
  const ref = this.dialog.open(EditExpenditureComponent,{
    data: id
  });
}
  
  chartLabels: string[] = [];
  getExpenditure(): Observable<Expenditure[] | null>{
      return this.usersService.getExpenditures();

  }
  openExpenditureDialog(){
    const ref = this.dialog.open(ExpendituresComponent);
  }
}

