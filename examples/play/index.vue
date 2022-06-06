<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <div style="margin: 20px;">
    <el-table-learn
    :data="tableData"
    :indent="30"
    row-key="id"
    height="550"
    border
    default-expand-all
    :default-sort = "{prop: 'date', order: 'descending'}"
    :tree-props="{children: 'children', hasChildren: 'hasChildren'}">
      <el-table-column
        type="index"
        width="100"
        fixed>
        <!-- TODO 这个地方需要注意，估计是scope里面的store数据量太大了，导致页面死循环了 -->
        <template slot="header" slot-scope="scope">
          <span>这是一个自定义表头</span>
        </template>
      </el-table-column>
      <!-- <el-table-column
        type="selection">
      </el-table-column> -->
      <!-- <el-table-column
        label="测试左固定"
        fixed
        prop="province">
      </el-table-column> -->
      <el-table-column label="个性特点">
        <el-table-column label="性别" prop="sex" :filter-method="dataFilter" width="200">
          <template slot-scope="scope">
            <el-select v-model="scope.row.sex" placeholder="请选择">
              <el-option
                v-for="item in sexOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="年龄" prop="age" width="100"></el-table-column>
      </el-table-column>
      <!-- :filtered-value="(item.prop === 'age') ? ['2'] : []" -->
      <template v-for="item in tbLabel">
        <el-table-column v-if="item.prop !== 'sex' && item.prop !== 'age'"
          :key="item.prop"
          :prop="item.prop"
          :width="(item.prop === 'address' || item.prop === 'name' || item.prop === 'zip') ? 400 : ''"
          :label="item.name">
          <template slot-scope="scope">
            <el-input v-if="item.prop === 'address' || item.prop === 'name' || item.prop === 'zip'" v-model="scope.row[item.prop]" />
            <el-select v-else-if="item.prop === 'city'" v-model="scope.row[item.prop]" placeholder="请选择">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
            <!-- <el-date-picker
              v-else-if="item.prop === 'date'"
              v-model="scope.row[item.prop]"
              type="date"
              placeholder="选择日期">
            </el-date-picker> -->
            <span v-else>{{scope.row[item.prop]}}</span>
          </template>
        </el-table-column>
      </template>
    </el-table-learn>
  </div>
</template>

<script>
  import {mockData} from './mock';
  // 表头
  const tbLabel = [
    {
      prop: 'date',
      name: '日期'
    },
    {
      prop: 'name',
      name: '姓名'
    },
    {
      prop: 'city',
      name: '城市'
    },
    {
      prop: 'address',
      name: '地址'
    },
    {
      prop: 'zip',
      name: '邮政编码'
    },
    {
      prop: 'sex',
      name: '性别'
    },
    {
      prop: 'age',
      name: '年龄'
    }
  ]
  export default {
    data() {
      return {
        tableData: mockData,
        tbLabel: tbLabel,
        form: {
          date: '',
          name: '',
          city: '',
          address: '',
          zip: ''
        },
        sexOptions: [
          {
            label: '男',
            value: '1'
          },
          {
            label: '女',
            value: '2'
          }
        ],
        options: [
          {
            label: '普陀区',
            value: '1'
          },
          {
            label: '普陀区2',
            value: '2'
          },
          {
            label: '普陀区3',
            value: '3'
          },
          {
            label: '普陀区4',
            value: '4'
          },
          {
            label: '普陀区5',
            value: '5'
          }
        ]
      };
    },
    mounted() {},
    methods: {
      dataFilter(value, row, column) {
        return row[column.property] === value;
      },
      // *测试column的render-header属性是否有用，测试结果是无用，只会有一个warn提示
      renderHeader(h) {
        return h('div', 'test')
      }
    }
  };
</script>
