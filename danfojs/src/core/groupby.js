import {DataFrame} from "./frame"
import { Utils } from "./utils"
const utils = new Utils

/**
 * The class performs all groupby operation on a dataframe
 * involveing all aggregate funciton
 * @param {col_dict} col_dict Object of unique keys in the group by column
 * @param {key_col} key_col Array contains the column names
 * @param {data} Array the dataframe data
 * @param {column_name} Array of all column name in the dataframe.
 */
export class GroupBy {
    constructor(col_dict,key_col, data, column_name) {
        
        this.key_col = key_col;
        this.col_dict = col_dict;
        this.data  = data;
        this.column_name = column_name;
        this.data_tensors = {} //store the tensor version of the groupby data

    }

    /**
     * Group the dataframe by the column by
     * creating an object to store the grouping
     * @returns Groupby data structure 
     */
    group(){

        if(this.key_col.length ==2){ //check if the dataframe is group by two columns

            
            for(var i=0; i < this.data.length; i++){
                
                let col1_index = this.column_name.indexOf(this.key_col[0]);
                let col2_index = this.column_name.indexOf(this.key_col[1]);

                let value = this.data[i];
                
                let col1_value = value[col1_index];
                let col2_value = value[col2_index];


                if(Object.prototype.hasOwnProperty.call(this.col_dict, col1_value)){
                    if(Object.prototype.hasOwnProperty.call(this.col_dict[col1_value], col2_value)){

                        this.col_dict[col1_value][col2_value].push(value);
                    }

                }

            }

            for(var key in this.col_dict){
                this.data_tensors[key] = {}

                for(var key2 in this.col_dict[key]){
                    
                    let data = this.col_dict[key][key2]; 
                    
                    if(data.length ==0){
                        delete this.col_dict[key][key2]; //delete the empty key.
                    }
                    else{
                        this.data_tensors[key][key2] = new DataFrame(data,{ columns:this.column_name})
                    }
                    
                }
            }
        }else{
            for(let i=0; i < this.data.length; i++){

                let col1_index = this.column_name.indexOf(this.key_col[0]);
        
                let value = this.data[i];

                let col1_value = value[col1_index];

                if(Object.prototype.hasOwnProperty.call(this.col_dict, col1_value)){
                    
                    this.col_dict[col1_value].push(value);

                }
            }
            for(let key in this.col_dict){
                let data = this.col_dict[key]
                
                this.data_tensors[key] = new DataFrame(data,{ columns:this.column_name})
                
            }
        
        }
        
        return this;

    }

    /**
     * obtain the column for each group
     * @param {col_name} col_name String name of a column
     * @return Groupby class
     */
    col(col_names){

        // if(!this.column_name.includes(col_name)){
        //     throw new Error(`Column ${col_name} does not exist in groups`)
        // }

        if(Array.isArray(col_names)){

            for(let i=0; i< col_names.length; i++){

                let col_name = col_names[i]
                if(!this.column_name.includes(col_name)){
                    throw new Error(`Column ${col_name} does not exist in groups`)
                }
            }
        }else{
            throw new Error(`Col_name must be an array of column`)
        }


        if(this.key_col.length ==2){

            this.group_col = {}

            for(var key1 in this.data_tensors){

                this.group_col[key1]  = {}
                for(var key2 in this.data_tensors[key1]){

                    this.group_col[key1][key2] = []
                    for(let i =0; i< col_names.length; i++){
                        let col_name = col_names[i]
                        let data = this.data_tensors[key1][key2].column(col_name)
                        this.group_col[key1][key2].push(data)
                    }
                    
                }
            }
        }
        else{

            this.group_col = {}

            for(let key1 in this.data_tensors){

                this.group_col[key1] = []
                for(let i =0; i< col_names.length; i++){
                    let col_name = col_names[i]
                    let data = this.data_tensors[key1].column(col_name)
                    this.group_col[key1].push(data)
                }
                
            }
        }

        return this;
    }

    /**
     * Basic root of all column arithemetic in groups
     * @param {operation} operatioin String 
     */
    arithemetic(operation){

        let ops_name = ["mean","sum","count","mode"]

        let ops_map = {
            "mean": "mean()",
            "sum": "sum()",
            "mode": "mode()",
            "count": "count()"
        }
        let is_array = false;

        if(Array.isArray(operation)){
            is_array = true
        }

        if(this.key_col.length ==2){

            let count_group = {}

            for(var key1 in this.group_col){

                count_group[key1]  = {}
                for(var key2 in this.group_col[key1]){

                    count_group[key1][key2] = []
                    for(let i=0; i <this.group_col[key1][key2].length; i++ ){
                        let data = null
                        if(is_array){
                            let op = operation[i]
                            if(!ops_name.includes(op)){
                                throw new Error("operation does not exist")
                            }
                            data = eval(`this.group_col[key1][key2][i].${ops_map[op]}`)

                        }else{
                            data = eval(`this.group_col[key1][key2][i].${operation}`)
                        }
                        
                        count_group[key1][key2].push(data)
                    }
                    
                }
            }
            return count_group
            
        }else{
            let count_group = {}

            for(let key1 in this.group_col){ 
                
                count_group[key1] = []
                for(let i=0; i <this.group_col[key1].length; i++ ){
                    let data = null
                    if(is_array){
                        let op = operation[i]
                        if(!ops_name.includes(op)){
                            throw new Error("operation does not exist")
                        }
                        data = eval(`this.group_col[key1][i].${ops_map[op]}`)

                    }else{
                        data = eval(`this.group_col[key1][i].${operation}`)
                    }
                    
                    count_group[key1].push(data)
                }
            }

            return count_group
        }


    }

    count(){

        let value = this.arithemetic("count()");
        return value;
    }

    sum(){
        let value = this.arithemetic("sum()")
        return value
    }



    /**
     * returns dataframe of a group
     * @param {*} key [Array] 
     */
    get_groups(key){

        if(this.key_col.length ==2){

            if(key.length == 2){
                let key1 = key[0]
                let key2 = key[1];

                utils.__is_object(this.data_tensors,key1, `Key Error: ${key1} not in object`)
                return this.data_tensors[key1][key2];
            }
            else{ throw new Error("specify the two group by column") }
        }
        else if(this.key_col.length ==1){ 

            if(key.length ==1){

                utils.__is_object(this.data_tensors,key[0], `Key Error: ${key[0]} not in object`)
                return this.data_tensors[key[0]];
            }
            else{ throw new Error("specify the one group by column") }
        }
        return this.data_tensors[key]
    }

    /**
     * Map every column to an operaton
     * @param {kwargs} kwargs {column name: math operation}
     */
    agg(kwargs={}){

        let columns = Object.keys(kwargs)
        let operations = columns.map(x=>{ return kwargs[x]})
        
        this.col(columns)

        let data = this.arithemetic(operations)

        return data;
    }

}