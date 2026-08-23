<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'department_code'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['department_codes'];

    /**
     * Get all assigned department codes as an array.
     */
    public function getDepartmentCodesAttribute(): array
    {
        if (empty($this->department_code)) {
            return [];
        }

        // Try JSON decode first
        $decoded = json_decode($this->department_code, true);
        if (is_array($decoded)) {
            return array_values(array_filter($decoded));
        }

        // Try comma-separated
        if (str_contains($this->department_code, ',')) {
            return array_values(array_filter(array_map('trim', explode(',', $this->department_code))));
        }

        return [$this->department_code];
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user has edit permission for a department.
     */
    public function canEditDepartment(?string $departmentCode): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if (empty($departmentCode)) {
            return false;
        }

        $codes = array_map('strtolower', $this->department_codes);
        return in_array(strtolower($departmentCode), $codes, true);
    }
}
