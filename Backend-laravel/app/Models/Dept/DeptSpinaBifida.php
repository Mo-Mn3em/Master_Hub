<?php

namespace App\Models\Dept;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Cases;

class DeptSpinaBifida extends Model
{
    use HasFactory;

    protected $table = 'dept_spina_bifida';

    protected $guarded = ['id'];

    public function case()
    {
        return $this->belongsTo(Cases::class, 'case_id');
    }
}
