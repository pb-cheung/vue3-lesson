// 最长递增子序列

// c d e, 索引：2,3,4
// e c d h, 索引：4,2,3,0 // 0表示以前不存在

// [c,d]
// [0,1] 通过上面的两个序列，可以求出来，最终这样的结果，就可以保证某些元素不用移动

// 需要求：连续性最强的子序列
// 贪心算法 + 二分查找

// 2 3 1 5 6 8 7 9 4 2 -> 求最长子序列
// 算法
// 构造一个tails数组，tails[i]为：长度为i+1的递增序列末尾元素最有潜力（最小）的值
// 步骤1：遍历
// 遇到大的（超过当前队列最大的）添加到尾部
// 非最大的，找到比它大的替换掉（小的比大的有潜力）
// 同时，每加入一个值时，记录其前一个值，用于后续步骤追溯
// 2 （2的前一个是null）
// 2 3 （3的前一个是2）
// 1 3 （1的前一个是null）
// 1 3 5 （5的前一个是3）
// 1 3 5 6 （6的前一个是5）
// 1 3 5 6 8 （8的前一个是6）
// 1 3 5 6 7 （7的前一个是6）
// 1 3 5 6 7 9 （9的前一个是7）
// 1 3 4 6 7 9 （4的前一个是3）
// 1 2 4 6 7 9 （2的前一个是1）

// 步骤2：根据记录的前值，从最后一个值陆续找前值，得到目标子序列
// 9 7 6 5 3 2

// 实现最长子序列

function getSequence(arr) {
  const result = [0]; // tails 满足条件的序列包含的元素组成的数组
  const p = result.slice(0); // 用于存放索引
  const len = arr.length;
  let start;
  let end;
  let middle;

  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      // 为了vue3 而处理掉数组中的0的情况
      // 拿出结果集最后一项和我们当前的这一项做比对
      let resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p[i] = result[result.length - 1]; // 放到末尾的情况，前一个节点索引就是result中最后一个
        result.push(i); // 直接将当前的索引放入结果集
        continue;
      }
    }
    start = 0;
    end = result.length - 1;
    while (start < end) {
      middle = ((start + end) / 2) | 0; // 向下取整
      if (arr[result[middle]] < arrI) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    if (arrI < arr[result[start]]) {
      p[i] = result[start - 1]; // 找到的那个节点的前一个
      result[start] = i;
    }
  }
  // 需要创建一个前驱节点，进行倒序追溯，
  console.log('p: ', p); // p:  [ 0, 0, undefined, 1, 3, 4, 4, 6, 1 ]
  // 以p为前驱节点的列表，从最后一个节点做追溯
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last]; // 在数组中找到最后一个
  }

  return result;
}

// test
const arr1 = [2, 6, 7, 8, 9, 11];
console.log(getSequence(arr1)); // [ 0, 1, 2, 3, 4, 5 ]

const arr2 = [2, 3, 1, 5, 6, 8, 7, 9, 4];
console.log(getSequence(arr2)); // [ 0, 1, 3, 4, 6, 7 ]

//      [2, 3, 1, 5, 6, 8, 7, 9, 4];
// 索引   0, 1, 2, 3, 4, 5, 6, 7, 8
// 2 0
// 2,3 3的前一个索引是0
// 1,3 1的前一个索引是undefined
// 1,3,5 5的前一个索引是1
// 1,3,5,6 6的前一个索引是3
// 1,3,5,6,8 8的前一个索引是4
// 1,3,5,6,7 7的前一个索引是4
// 1,3,5,6,7,9 9的前一个索引是6
// 1,3,4,6,7,9 4的前一个索引是1

// 9->7->6->4->3->1
// [9]
// [7,9]
// [6,7,9]
// [5,6,7,9]
// [3,5,6,7,9]
// [2,3,5,6,7,9]
