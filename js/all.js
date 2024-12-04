// C3.js
function renderChart(data) {
    let chart = c3.generate({
        bindto: '#chart',
        color: {
            pattern: ["#DACBFF", "#9D7FEA", "#5434A7", "#301E5F"]
        },
        data: {
            type: "pie",
            columns: data,
        }
    });
}

// 取得訂單
let orderData = [];
function getOrder() {
    axios
        .get(adminUrl, {
            headers: {
                authorization: token
            }
        })
        .then((response) => {
            orderData = response.data.orders;
            orderData.sort((a, b) => { return b.createdAt - a.createdAt });
            renderOrder();
            chartData();
        })
        .catch((error) => {
            console.log(error.message);
        });
}

// 渲染訂單
const orderPageTableBody = document.querySelector(".orderPage-table tbody");
function renderOrder() {
    let template = "";
    orderData.forEach((data) => {
        let orderItem = "";
        data.products.forEach((item) => {
            orderItem += `<p>${item.title} x ${item.quantity}</p>`;
        })
        template += `<tr data-id="${data.id}">
                    <td>${data.id}</td>
                    <td>
                        <p>${data.user.name}</p>
                        <p>${data.user.tel}</p>
                    </td>
                    <td>${data.user.address}</td>
                    <td>${data.user.email}</td>
                    <td>
                        <p>${orderItem}</p>
                    </td>
                    <td>${formateTime(data.createdAt)}</td>
                    <td class="orderStatus">
                        <a href="#" class="orderStatusBtn">${data.paid ? `<span style="color:green">已處理</span>` : `<span style="color:red">未處理</span>`}</a>
                    </td>
                    <td>
                        <input type="button" class="delSingleOrder-Btn" value="刪除">
                    </td>
                </tr>`
    })
    orderPageTableBody.innerHTML = template;
}

// 整理時間格式
function formateTime(timestamp) {
    const time = new Date(timestamp * 1000)
    // return `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${String(time.getMinutes()).padStart(2,0)}:${time.getSeconds()}`
    return time.toLocaleString("zh-TW", { hour12: false });
}

// 刪除單筆訂單
function deleteSingleOrder(id) {
    axios.delete(`${adminUrl}/${id}`, {
        headers: {
            authorization: token
        }
    }).then((response) => {
        orderData = response.data.orders;
        renderOrder()
        chartData()
    }).catch((error) => {
        console.log(error.message);
    })
}

orderPageTableBody.addEventListener("click", (event) => {
    const id = event.target.closest("tr").getAttribute("data-id");
    if (event.target.classList.contains("delSingleOrder-Btn")) {
        deleteSingleOrder(id);
    }
    if (event.target.nodeName === "SPAN") {
        event.preventDefault();
        updateOrderStatus(id);
    }
})

// 刪除所有訂單
function deleteOrder() {
    axios.delete(adminUrl, {
        headers: {
            authorization: token
        }
    }).then((response) => {
        orderData = response.data.orders;
        renderOrder();
        chartData();
    }).catch((error) => {
        console.log(error.message);
    })
}
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (orderData.length === 0) {
        alert("目前沒有任何訂單");
        return;
    }
    deleteOrder();
})

// 修改訂單狀態(已處理/未處理)
function updateOrderStatus(id) {
    let result = {};
    orderData.forEach((order) => {
        if (order.id === id) {
            result = order;
        }
    });
    const data = {
        data: {
            id: id,
            paid: !result.paid,
        }
    }
    axios.put(adminUrl, data, {
        headers: {
            authorization: token
        }
    }).then((response) => {
        orderData = response.data.orders;
        renderOrder();
    }).catch((error) => {
        console.log(error.message);
    })
}

// 組成圖表資料Lv1 產品類別營收比重
const pieChart = document.querySelector("#chart");
const sectionTitle = document.querySelector(".section-title");
function chartData() {
    sectionTitle.textContent = "全產品類別營收比重";
    if (orderData.length > 0) {
        let productData = {};
        orderData.forEach((order) => {
            order.products.forEach((product) => {
                if (!productData[product.category]) {
                    productData[product.category] = product.price * product.quantity;
                } else if (productData[product.category]) {
                    productData[product.category] += product.price * product.quantity;
                }
            })
        })
        renderChart(Object.entries(productData));
    } else if (!orderData.length) {
        pieChart.style.display = "none";
    }
}

// 組成圖表資料Lv2 全品項營收比重
function allProductChartData() {
    sectionTitle.textContent = "全品項營收比重";
    if (orderData.length > 0) {
        let productData = {};
        orderData.forEach((order) => {
            order.products.forEach((product) => {
                if (!productData[product.title]) {
                    productData[product.title] = product.price * product.quantity;
                } else if (productData[product.title]) {
                    productData[product.title] += product.price * product.quantity;
                }
            })
        })
        const productDataArr = Object.entries(productData);
        const sortProductData = productDataArr.sort(function (a, b) { return b[1] - a[1] });
        const topThreeData = [];
        let otherData = 0;
        sortProductData.forEach((product, index) => {
            if (index <= 2) {
                topThreeData.push(product);
            }
            if (index > 2) {
                otherData += product[1];
            }
        })
        if (sortProductData.length > 3) {
            topThreeData.push(["其他", otherData]);
        }
        renderChart(topThreeData);
    } else if (!orderData.length) {
        pieChart.style.display = "none";
    }
}

// 初始化
function init(){
    getOrder();
}
init()