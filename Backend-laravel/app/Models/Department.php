<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $table = 'departments';

    protected $fillable = [
        'code',
        'name',
        'color',
        'pfx',
    ];

    public function cases()
    {
        return $this->belongsToMany(Cases::class, 'case_department', 'department_id', 'case_id')
                    ->withTimestamps();
    }
}
