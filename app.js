var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var multer = require('multer')
var cloudinary = require('cloudinary')
var method_override = require('method-override')
var path = require('path')
var app_password = '123'

var app = express()
app.use(express.static('./public'))


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
//app.use(multer({dest: './public/uploads'}).single('image_avatar'))
app.use(method_override('_method'))

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb)
    }
}).single('imageUrl');

// Check File Type
function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: Images Only!');
    }
}

cloudinary.config({
    cloud_name: 'lajugueteriadepapa',
    api_key: '659547849748457',
    api_secret: 'ckHFYd5KXmdTxVYTBNzbn7UlXBk'
})

const bluebird = require('bluebird');
mongoose.Promise = bluebird;

mongoose.connect('mongodb://localhost/juguetes', {useMongoClient: true})

//Definir el schema de nuestros productos
var productSchema = {
    title: String,
    description: String,
    imageUrl: String,
    pricing: Number,
    categoria: String,
    password: Number
}

var Nuevo = mongoose.model('Nuevo', productSchema)

app.set('view engine', 'ejs')



app.get('/', function(solicitud, respuesta){
    respuesta.render('index')
})


app.get('/new', function(solicitud, respuesta){
    respuesta.render('new')
})


app.post('/new', function(req, res){
    
        console.log(req.bodyParser)
        upload(req, res, function(err) {
            
                if(err){
                    res.render('new', { msg: err });
                    
                }
                
                if(req.body.password != app_password){
                                       
                    res.render('new', {msg: 'Error: Password Incorrecto'})
                    console.log('VETE A LA MIERDA')
                    return false;
                }
                else {
                    
                    if(req.file == undefined){
                        res.render('new', { msg: 'Error: No File Seleceted!!'})
                       
                    } else {

                        var data = {
                            title: req.body.title,
                            description: req.body.description,
                            imageUrl: 'data.png',
                            pricing: req.body.pricing,
                            categoria: req.body.categoria,
                        }
                
                        var nuevo = new Nuevo(data)
                
                        req.file.imageUrl

                        cloudinary.uploader.upload(req.file.path, 
                            function(result) {  
                                nuevo.imageUrl = result.url
                                nuevo.save(function(err){
                                    console.log(nuevo)
                                    
                                })
                            }
                        );

                            res.render('index', {
                                msg: 'File Uploaded!',
                                file: `uploads/${req.file.filename}`,
                                title: `${req.body.title}`
                                
                            })
                      
                    }
                }
               
        });

});

app.get('/productos', function(req, res){
    Nuevo.find(function(error, documento){
        if(error){console.log(error)}
        res.render('productos', { products: documento })
    })
    
})

app.post('/admin', function(req, res){
    if(req.body.password == app_password){
        Nuevo.find(function(error, documento){
            if(error){console.log(error)}
            res.render('admin/index', { products: documento })
        })    
    }else{
        res.redirect('/')
    }
})

app.get('/admin', function(req, res){
    res.render('admin/form')
})

app.get('/productos/edit/:id', function(req, res){
    var id_producto = req.params.id

    Nuevo.findOne({_id: id_producto}, function(error, producto){
        console.log('Obtengo el producto a modificar\n' + producto)
        res.render('productos/edit', {product: producto})
    })
})

app.put('/productos/:id', function(req, res){

    upload(req, res, function(err) {
            
        if(err){
            res.render('new', { msg: err });
            
        }
        
        if(req.body.password != app_password){
                               
            res.render('new', {msg: 'Error: Password Incorrecto'})
            console.log('VETE A LA MIERDA')
            return false;
        }
        else {
            
            if(req.file == undefined){
                res.render('new', { msg: 'Error: No File Seleceted!!'})
               
            } else {

                var data = {
                    title: req.body.title,
                    description: req.body.description,
                    imageUrl: 'data.png',
                    pricing: req.body.pricing,
                    categoria: req.body.categoria                   
                }
        
                var nuevo = new Nuevo(data)
                
                console.log(nuevo)

                cloudinary.uploader.upload(req.file.path, 
                    function(result) {  
                        nuevo.imageUrl = result.url

                        data.imageUrl = nuevo.imageUrl                 
                    
                        Nuevo.update({'_id': req.params.id}, data ,function(product){
                            console.log('Obtengo el producto a modificado\n' + nuevo)
                            console.log('URL_IMAGEN: ' + nuevo.imageUrl)
                            console.log(data)                       
                        })
                    }
                );
                
                
                res.redirect('/productos')
                          
            }
        }       
    });

})

app.get('/productos/new', function (req, res) {
    res.render('productos/new')
})

app.get('/productos/delete/:id', function(req, res){
    var id = req.params.id

    Nuevo.findOne({'_id': id}, function(err, producto){
        res.render('productos/delete', {producto: producto})
    })
})

app.delete('/productos/:id', function(req, res){
    var id = req.params.id
    if(req.body.password == app_password){
        Nuevo.remove({'_id': id},function(err){
            if(err){console.log(err)}
            res.redirect('/productos')
        })
    }
    else{
        res.redirect('/productos')
    }

});

app.get('/productos/juguete/:id', function(req, res){
    var id_producto = req.params.id

    Nuevo.findOne({_id: id_producto}, function(error, producto){
        console.log('Obtengo el producto a mostrar\n' + producto)
        res.render('productos/juguete', {product: producto})
    })    
})

app.get('/categoria/nenas/', function(req, res){
    //var categoria = req.params.categoria
    Nuevo.find({categoria: 'nena'},function(error, producto){
        if(error){console.log(error)}
        res.render('categoria/nenas', { products: producto })
    })
    
})

app.get('/categoria/nenes/', function(req, res){
    //var categoria = req.params.categoria
    Nuevo.find({categoria: 'nene'},function(error, producto){
        if(error){console.log(error)}
        res.render('categoria/nenes', { products: producto })
    })
    
})

//Error 404
app.use(function(req, res){
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not found');
});

// Pagina de error 500
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

app.listen(8080)