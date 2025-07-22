export default function getSequence(arr) {
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
  // console.log('p: ', p); // p:  [ 0, 0, undefined, 1, 3, 4, 4, 6, 1 ]
  // 以p为前驱节点的列表，从最后一个节点做追溯
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last]; // 在数组中找到最后一个
  }

  return result;
}
