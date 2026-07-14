<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],

    'allowed_origins' => [
        'https://hamemayu.id',
        'https://www.hamemayu.id',
        'http://localhost:3000',
        'http://10.4.60.240:3000',
        'http://localhost',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_methods' => ['*'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
